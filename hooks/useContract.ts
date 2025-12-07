"use client"

/**
 * ============================================================================
 * BOOKMARK MANAGER CONTRACT INTEGRATION HOOK
 * ============================================================================
 */

import { useState, useEffect } from "react"
import {
  useCurrentAccount,
  useIotaClient,
  useSignAndExecuteTransaction,
  useIotaClientQuery,
} from "@iota/dapp-kit"
import { Transaction } from "@iota/iota-sdk/transactions"
import { useNetworkVariable } from "@/lib/config"
import type { IotaObjectData } from "@iota/iota-sdk/client"

export const CONTRACT_MODULE = "contract"
export const CONTRACT_METHODS = {
  CREATE: "create",
  ADD_BOOKMARK: "add_bookmark",
  REMOVE_BOOKMARK: "remove_bookmark",
} as const

function getObjectFields(data: IotaObjectData): { bookmark_count: number; owner: string } | null {
  if (data.content?.dataType !== "moveObject") {
    return null
  }
  
  const fields = data.content.fields as any
  if (!fields) return null
  
  let bookmark_count: number
  if (typeof fields.bookmark_count === "string") {
    bookmark_count = parseInt(fields.bookmark_count, 10)
    if (isNaN(bookmark_count)) return null
  } else if (typeof fields.bookmark_count === "number") {
    bookmark_count = fields.bookmark_count
  } else {
    return null
  }
  
  if (!fields.owner) return null
  const owner = String(fields.owner)
  
  return { bookmark_count, owner }
}

export interface ContractData {
  bookmark_count: number
  owner: string
}

export interface ContractState {
  isLoading: boolean
  isPending: boolean
  isConfirming: boolean
  isConfirmed: boolean
  hash: string | undefined
  error: Error | null
}

export interface ContractActions {
  createObject: () => Promise<void>
  addBookmark: () => Promise<void>
  removeBookmark: () => Promise<void>
  clearObject: () => void
}

export const useContract = () => {
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const packageId = useNetworkVariable("packageId")
  const iotaClient = useIotaClient()
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()
  const [objectId, setObjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hash, setHash] = useState<string | undefined>()
  const [transactionError, setTransactionError] = useState<Error | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.slice(1)
      if (hash) setObjectId(hash)
    }
  }, [])

  const { data, isPending: isFetching, error: queryError, refetch } = useIotaClientQuery(
    "getObject",
    {
      id: objectId!,
      options: { showContent: true, showOwner: true },
    },
    {
      enabled: !!objectId,
    }
  )

  const fields = data?.data ? getObjectFields(data.data) : null
  const isOwner = fields?.owner.toLowerCase() === address?.toLowerCase()
  const objectExists = !!data?.data
  const hasValidData = !!fields

  const createObject = async () => {
    if (!packageId) return

    try {
      setIsLoading(true)
      setTransactionError(null)
      setHash(undefined)
      const tx = new Transaction()
      tx.moveCall({
        arguments: [],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.CREATE}`,
      })

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            try {
              const { effects } = await iotaClient.waitForTransaction({
                digest,
                options: { showEffects: true },
              })
              const newObjectId = effects?.created?.[0]?.reference?.objectId
              if (newObjectId) {
                setObjectId(newObjectId)
                if (typeof window !== "undefined") {
                  window.location.hash = newObjectId
                }
                setIsLoading(false)
              } else {
                setIsLoading(false)
              }
            } catch (waitError) {
              console.error("Error waiting for transaction:", waitError)
              setIsLoading(false)
            }
          },
          onError: (err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            setTransactionError(error)
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      setIsLoading(false)
    }
  }

  const addBookmark = async () => {
    if (!objectId || !packageId) return

    try {
      setIsLoading(true)
      setTransactionError(null)
      const tx = new Transaction()
      tx.moveCall({
        arguments: [tx.object(objectId)],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.ADD_BOOKMARK}`,
      })

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            await iotaClient.waitForTransaction({ digest })
            await refetch()
            setIsLoading(false)
          },
          onError: (err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            setTransactionError(error)
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      setIsLoading(false)
    }
  }

  const removeBookmark = async () => {
    if (!objectId || !packageId) return

    try {
      setIsLoading(true)
      setTransactionError(null)
      const tx = new Transaction()
      tx.moveCall({
        arguments: [tx.object(objectId)],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.REMOVE_BOOKMARK}`,
      })

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            await iotaClient.waitForTransaction({ digest })
            await refetch()
            setIsLoading(false)
          },
          onError: (err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            setTransactionError(error)
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      setIsLoading(false)
    }
  }

  const contractData: ContractData | null = fields
    ? {
        bookmark_count: fields.bookmark_count,
        owner: fields.owner,
      }
    : null

  const clearObject = () => {
    setObjectId(null)
    setTransactionError(null)
    if (typeof window !== "undefined") {
      window.location.hash = ""
    }
  }

  const actions: ContractActions = {
    createObject,
    addBookmark,
    removeBookmark,
    clearObject,
  }

  const contractState: ContractState = {
    isLoading: (isLoading && !objectId) || isPending || isFetching,
    isPending,
    isConfirming: false,
    isConfirmed: !!hash && !isLoading && !isPending,
    hash,
    error: queryError || transactionError,
  }

  return {
    data: contractData,
    actions,
    state: contractState,
    objectId,
    isOwner,
    objectExists,
    hasValidData,
  }
}
