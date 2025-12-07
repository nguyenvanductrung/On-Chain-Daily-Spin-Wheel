"use client"

import { useCurrentAccount } from "@iota/dapp-kit"
import { useContract } from "@/hooks/useContract"
import { Button, Container, Flex, Heading, Text, Card, Badge } from "@radix-ui/themes"
import ClipLoader from "react-spinners/ClipLoader"

const SampleIntegration = () => {
  const currentAccount = useCurrentAccount()
  const { data, actions, state, objectId, isOwner, objectExists, hasValidData } = useContract()
  
  const isConnected = !!currentAccount

  if (!isConnected) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <Card style={{ maxWidth: "500px", width: "100%", padding: "2rem" }}>
          <Heading size="6" style={{ marginBottom: "1rem" }}>🔖 Bookmark Manager</Heading>
          <Text>Please connect your wallet to start managing your bookmarks on the blockchain.</Text>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", padding: "2rem", background: "var(--gray-a2)" }}>
      <Container style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Heading size="8" style={{ marginBottom: "0.5rem" }}>🔖 Bookmark Manager</Heading>
        <Text size="3" style={{ color: "var(--gray-a11)", marginBottom: "2rem", display: "block" }}>
          Manage your bookmarks securely on the IOTA blockchain
        </Text>

        {!objectId ? (
          <Card style={{ padding: "2rem" }}>
            <Text size="4" style={{ marginBottom: "1rem", display: "block" }}>
              Create your bookmark manager to get started
            </Text>
            <Button
              size="3"
              onClick={actions.createObject}
              disabled={state.isPending}
            >
              {state.isPending ? (
                <>
                  <ClipLoader size={16} style={{ marginRight: "8px" }} />
                  Creating...
                </>
              ) : (
                "Create Bookmark Manager"
              )}
            </Button>
            {state.error && (
              <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--red-a3)", borderRadius: "8px" }}>
                <Text style={{ color: "var(--red-11)" }}>
                  Error: {(state.error as Error)?.message || String(state.error)}
                </Text>
              </div>
            )}
          </Card>
        ) : (
          <div>
            {state.isLoading && !data ? (
              <Card style={{ padding: "2rem", textAlign: "center" }}>
                <ClipLoader size={32} />
                <Text style={{ display: "block", marginTop: "1rem" }}>Loading bookmark manager...</Text>
              </Card>
            ) : state.error ? (
              <Card style={{ padding: "2rem", background: "var(--red-a3)" }}>
                <Text style={{ color: "var(--red-11)", display: "block", marginBottom: "0.5rem" }}>
                  Error loading bookmark manager
                </Text>
                <Text size="2" style={{ color: "var(--red-11)" }}>
                  {state.error.message || "Object not found or invalid"}
                </Text>
                <Button
                  size="2"
                  variant="soft"
                  onClick={actions.clearObject}
                  style={{ marginTop: "1rem" }}
                >
                  Clear & Create New
                </Button>
              </Card>
            ) : data ? (
              <div>
                <Card style={{ padding: "2rem", marginBottom: "1.5rem" }}>
                  <Flex justify="between" align="center" style={{ marginBottom: "1rem" }}>
                    <div>
                      <Text size="2" style={{ display: "block", marginBottom: "0.5rem", color: "var(--gray-a11)" }}>
                        Total Bookmarks
                      </Text>
                      <Heading size="9">{data.bookmark_count}</Heading>
                    </div>
                    {isOwner && (
                      <Badge color="green" size="2">Owner</Badge>
                    )}
                  </Flex>
                  <Text size="1" style={{ color: "var(--gray-a11)", fontFamily: "monospace", wordBreak: "break-all" }}>
                    Manager ID: {objectId}
                  </Text>
                </Card>

                {isOwner && (
                  <Card style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                    <Text size="4" style={{ marginBottom: "1rem", display: "block", fontWeight: "500" }}>
                      Manage Bookmarks
                    </Text>
                    <Flex gap="2">
                      <Button
                        size="3"
                        onClick={actions.addBookmark}
                        disabled={state.isLoading || state.isPending}
                        style={{ flex: 1 }}
                      >
                        {state.isLoading || state.isPending ? (
                          <ClipLoader size={16} />
                        ) : (
                          "➕ Add Bookmark"
                        )}
                      </Button>
                      <Button
                        size="3"
                        variant="soft"
                        color="red"
                        onClick={actions.removeBookmark}
                        disabled={state.isLoading || state.isPending || data.bookmark_count === 0}
                        style={{ flex: 1 }}
                      >
                        {state.isLoading || state.isPending ? (
                          <ClipLoader size={16} />
                        ) : (
                          "➖ Remove Bookmark"
                        )}
                      </Button>
                    </Flex>
                  </Card>
                )}

                {state.hash && (
                  <Card style={{ padding: "1.5rem", marginBottom: "1rem", background: "var(--green-a3)" }}>
                    <Text size="2" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Transaction Hash
                    </Text>
                    <Text size="1" style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{state.hash}</Text>
                    {state.isConfirmed && (
                      <Badge color="green" style={{ marginTop: "0.5rem" }}>
                        ✓ Transaction confirmed!
                      </Badge>
                    )}
                  </Card>
                )}

                {state.error && (
                  <Card style={{ padding: "1.5rem", background: "var(--red-a3)" }}>
                    <Text style={{ color: "var(--red-11)" }}>
                      Error: {(state.error as Error)?.message || String(state.error)}
                    </Text>
                  </Card>
                )}
              </div>
            ) : (
              <Card style={{ padding: "2rem" }}>
                <Text style={{ color: "var(--yellow-11)" }}>Bookmark manager not found</Text>
                <Button
                  size="2"
                  variant="soft"
                  onClick={actions.clearObject}
                  style={{ marginTop: "1rem" }}
                >
                  Clear & Create New
                </Button>
              </Card>
            )}
          </div>
        )}
      </Container>
    </div>
  )
}

export default SampleIntegration
