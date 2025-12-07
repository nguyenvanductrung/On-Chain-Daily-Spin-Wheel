// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2024 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Bookmark Manager Contract
/// A shared object for managing bookmarks.
/// Rules:
/// - anyone can create and share a bookmark manager
/// - owner can add bookmarks
/// - owner can remove bookmarks
/// - owner can update bookmark count
module bookmarkmanager::contract {
  /// A shared bookmark manager object.
  public struct Bookmarkmanager has key {
    id: UID,
    owner: address,
    bookmark_count: u64
  }

  /// Create and share a Bookmarkmanager object.
  public fun create(ctx: &mut TxContext) {
    transfer::share_object(Bookmarkmanager {
      id: object::new(ctx),
      owner: ctx.sender(),
      bookmark_count: 0
    })
  }

  /// Add a bookmark (only owner can add)
  public fun add_bookmark(manager: &mut Bookmarkmanager, ctx: &TxContext) {
    assert!(manager.owner == ctx.sender(), 0);
    manager.bookmark_count = manager.bookmark_count + 1;
  }

  /// Remove a bookmark (only owner can remove)
  public fun remove_bookmark(manager: &mut Bookmarkmanager, ctx: &TxContext) {
    assert!(manager.owner == ctx.sender(), 0);
    assert!(manager.bookmark_count > 0, 1);
    manager.bookmark_count = manager.bookmark_count - 1;
  }

  /// Get bookmark count
  public fun get_bookmark_count(manager: &Bookmarkmanager): u64 {
    manager.bookmark_count
  }
}

