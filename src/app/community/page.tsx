"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MessageCircle, Gift, User, Bell } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ensureRegisteredAccount } from "@/lib/client/login-gate";
import {
  getPostsByFeed, addPost, toggleLike, toggleFavorite, addComment,
  getComments, repostPost, toggleFollow, searchCommunity, isFavorited,
} from "@/lib/community-store";
import type { CommunityPost, CommunityComment } from "@/lib/types";
import ConfirmModal from "@/components/ConfirmModal";
import CommunityPostCard from "@/components/CommunityPostCard";
import CommunityComposeBox from "@/components/CommunityComposeBox";
import GiftFoodModal from "@/components/GiftFoodModal";
import PageHeader from "@/components/ui/PageHeader";
import PageCarouselBanner from "@/components/PageCarouselBanner";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { PAGE_BANNERS } from "@/lib/page-banners";

type FeedTab = "all" | "following" | "hot";

const FEED_TABS = [
  { id: "all" as const, label: "广场" },
  { id: "following" as const, label: "我的关注" },
  { id: "hot" as const, label: "热门" },
];

export default function CommunityPage() {
  const { user } = useApp();
  const [feedTab, setFeedTab] = useState<FeedTab>("all");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [content, setContent] = useState("");
  const [postImages, setPostImages] = useState<string[]>([]);
  const [commentImages, setCommentImages] = useState<Record<string, string | null>>({});
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [shareTip, setShareTip] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ type: "favorite" | "repost"; post: CommunityPost } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ users: { id: string; nickname: string; avatar: string }[]; posts: CommunityPost[] } | null>(null);
  const [giftTarget, setGiftTarget] = useState<string | null>(null);

  const uid = user?.id ?? "";

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults(null); return; }
    setSearchResults(searchCommunity(q));
  };

  const refresh = () => {
    setPosts(getPostsByFeed(feedTab, uid));
  };

  useEffect(() => { refresh(); }, [feedTab, uid]);

  const handlePost = () => {
    void (async () => {
    if (!content.trim() && postImages.length === 0) return;
    if (!(await ensureRegisteredAccount("登录或注册后即可发帖"))) return;
    addPost(content.trim(), postImages);
    refresh();
    setContent("");
    setPostImages([]);
    })();
  };

  const handleFavoriteClick = (post: CommunityPost) => {
    if (isFavorited(post, uid)) {
      toggleFavorite(post.id);
      refresh();
      return;
    }
    setConfirm({ type: "favorite", post });
  };

  const handleRepostClick = (post: CommunityPost) => {
    setConfirm({ type: "repost", post });
  };

  const onConfirm = () => {
    if (!confirm) return;
    if (confirm.type === "favorite") toggleFavorite(confirm.post.id);
    else repostPost(confirm.post);
    setConfirm(null);
    refresh();
    setShareTip(confirm.type === "repost" ? "已转发到社区广场" : "收藏成功");
    setTimeout(() => setShareTip(null), 2500);
  };

  const toggleComments = (postId: string) => {
    if (expandedPost === postId) setExpandedPost(null);
    else {
      setExpandedPost(postId);
      setComments((prev) => ({ ...prev, [postId]: getComments(postId) }));
    }
  };

  const handleComment = (postId: string) => {
    const text = commentDraft[postId]?.trim() ?? "";
    const img = commentImages[postId] ?? undefined;
    if (!text && !img) return;
    addComment(postId, text, img ?? undefined);
    setComments((prev) => ({ ...prev, [postId]: getComments(postId) }));
    setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
    setCommentImages((prev) => ({ ...prev, [postId]: null }));
    refresh();
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "刚刚";
    if (h < 24) return `${h}小时前`;
    return `${Math.floor(h / 24)}天前`;
  };

  return (
    <>
      <PageHeader
        title="社区"
        subtitle="分享命理心得 · 交流运势感悟"
      >
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-app-muted" />
          <input
            className="app-input !py-2 pl-9 text-xs"
            placeholder="搜索用户、ID、帖子、关键词..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        {searchResults && (searchResults.users.length > 0 || searchResults.posts.length > 0) && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-app-border bg-app-card p-2">
            {searchResults.users.map((u) => (
              <div key={u.id} className="mb-2 flex items-center gap-2 rounded-lg p-2 hover:bg-app-bg">
                <Link href={`/community/user/${u.id}`} className="flex min-w-0 flex-1 items-center gap-2">
                  <img src={u.avatar} alt="" className="h-8 w-8 rounded-full" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-app-text">{u.nickname}</p>
                    <p className="text-[10px] text-app-muted">{u.id}</p>
                  </div>
                </Link>
                {u.id !== uid && (
                  <div className="flex gap-1">
                    <Link href={`/community/messages?with=${u.id}`}
                      className="rounded-lg border border-app-border p-1.5" title="私信">
                      <MessageCircle className="h-3.5 w-3.5 text-app-accent" />
                    </Link>
                    <button onClick={() => setGiftTarget(u.id)}
                      className="rounded-lg border border-app-border p-1.5" title="赠送灵丹">
                      <Gift className="h-3.5 w-3.5 text-app-gold" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {searchResults.posts.map((p) => (
              <Link key={p.id} href={`/community/user/${p.userId}`}
                className="mb-1 block rounded-lg p-2 text-xs text-app-muted hover:bg-app-bg">
                <span className="text-app-text">@{p.nickname}</span> {p.content.slice(0, 40)}…
              </Link>
            ))}
          </div>
        )}
        {shareTip && (
          <p className="caption mt-2 rounded-lg bg-app-accent/10 px-3 py-1.5 text-app-accent">{shareTip}</p>
        )}
      </PageHeader>

      <PageCarouselBanner slides={PAGE_BANNERS.community} className="!mb-3 !pt-0" />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Link
          href="/community/me"
          className="flex flex-col items-center rounded-xl border border-app-border bg-app-card p-3 text-center transition-colors hover:border-app-gold/50"
        >
          <div className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-app-gold/15">
            <User className="h-4 w-4 text-app-gold" />
          </div>
          <span className="caption font-semibold text-app-text">个人中心</span>
          <span className="micro mt-0.5 leading-tight text-app-muted">发帖 · 收藏 · 评论</span>
        </Link>
        <Link
          href="/community/messages"
          className="flex flex-col items-center rounded-xl border border-app-border bg-app-card p-3 text-center transition-colors hover:border-app-accent/50"
        >
          <div className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-app-accent/10">
            <Bell className="h-4 w-4 text-app-accent" />
          </div>
          <span className="caption font-semibold text-app-text">消息</span>
          <span className="micro mt-0.5 leading-tight text-app-muted">私信 · 系统通知</span>
        </Link>
      </div>

      <SegmentedControl value={feedTab} options={FEED_TABS} onChange={setFeedTab} size="sm" />

      <div className="mb-4">
        <CommunityComposeBox
          content={content}
          images={postImages}
          onContentChange={setContent}
          onImagesChange={setPostImages}
          onSubmit={handlePost}
        />
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <p className="py-8 text-center text-xs text-app-muted">
            {feedTab === "following" ? "关注用户后，他们的帖子会出现在这里" :
              feedTab === "hot" ? "暂无精华帖，运营加精华后显示" : "暂无帖子"}
          </p>
        ) : posts.map((post) => (
          <CommunityPostCard
            key={post.id}
            post={post}
            uid={uid}
            expanded={expandedPost === post.id}
            comments={comments[post.id] ?? []}
            commentDraft={commentDraft[post.id] ?? ""}
            commentImage={commentImages[post.id] ?? null}
            timeAgo={timeAgo}
            onToggleComments={() => toggleComments(post.id)}
            onCommentDraftChange={(v) => setCommentDraft((prev) => ({ ...prev, [post.id]: v }))}
            onCommentImageChange={(v) => setCommentImages((prev) => ({ ...prev, [post.id]: v }))}
            onComment={() => handleComment(post.id)}
            onLike={() => { toggleLike(post.id); refresh(); }}
            onFavorite={() => handleFavoriteClick(post)}
            onRepost={() => handleRepostClick(post)}
            onFollow={() => { toggleFollow(post.userId); refresh(); }}
          />
        ))}
      </div>

      <ConfirmModal
        open={!!confirm}
        title={confirm?.type === "favorite" ? "确认收藏" : "确认转发"}
        message={confirm?.type === "favorite"
          ? "确定要收藏这条帖子吗？"
          : `确定要转发 @${confirm?.post?.nickname ?? ""} 的帖子到社区广场吗？`}
        onConfirm={onConfirm}
        onCancel={() => setConfirm(null)}
      />

      {giftTarget && uid && (
        <GiftFoodModal
          open={!!giftTarget}
          onClose={() => setGiftTarget(null)}
          toUserId={giftTarget}
          fromUserId={uid}
        />
      )}
    </>
  );
}
