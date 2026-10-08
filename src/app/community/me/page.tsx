"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Bell, Bookmark, MessageCircle, Repeat2, Send, Users, UserPlus, Heart } from "lucide-react";
import ComingSoonModal from "@/components/ComingSoonModal";
import { useApp } from "@/context/AppContext";
import { ensureRegisteredAccount } from "@/lib/client/login-gate";
import {
  getMyPosts, getMyFavoritePosts, getMyComments, getMyRepostPosts,
  getFollowerUsers, getFollowingUsers, addPost,
} from "@/lib/community-store";
import { getMessages } from "@/lib/message-store";
import { acceptDmFrom, rejectDmFrom } from "@/lib/dm-store";
import CommunityComposeBox from "@/components/CommunityComposeBox";
import UserAvatar from "@/components/UserAvatar";
import type { CommunityPost, AppMessage } from "@/lib/types";

type ContentTab = "posts" | "messages" | "reposts" | "favorites" | "comments";
type ViewTab = ContentTab | "fans" | "following";

const MENU_TABS: { id: ContentTab; label: string; icon: typeof Bell }[] = [
  { id: "posts", label: "我的发帖", icon: Send },
  { id: "messages", label: "我的消息", icon: Bell },
  { id: "reposts", label: "我的转发", icon: Repeat2 },
  { id: "favorites", label: "我的收藏", icon: Bookmark },
  { id: "comments", label: "我的评论", icon: MessageCircle },
];

export default function CommunityMePage() {
  const { user } = useApp();
  const [tab, setTab] = useState<ViewTab>("posts");
  const [matchOpen, setMatchOpen] = useState(false);
  const [uid, setUid] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postImages, setPostImages] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user?.id) setUid(user.id);
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab") as ViewTab;
    if (t === "fans" || t === "following" || MENU_TABS.some((x) => x.id === t)) setTab(t);
  }, [user?.id]);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "刚刚";
    if (h < 24) return `${h}小时前`;
    return `${Math.floor(h / 24)}天前`;
  };

  if (!uid) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-xs text-app-muted">加载中…</p>
      </div>
    );
  }

  const messages = getMessages(uid);
  const posts = getMyPosts(uid);
  const favorites = getMyFavoritePosts(uid);
  const comments = getMyComments(uid);
  const reposts = getMyRepostPosts(uid);
  const fans = getFollowerUsers(uid);
  const following = getFollowingUsers(uid);

  const countFor = (id: ContentTab) => {
    if (id === "posts") return posts.length;
    if (id === "messages") return messages.length;
    if (id === "reposts") return reposts.length;
    if (id === "favorites") return favorites.length;
    return comments.length;
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  const handlePost = () => {
    void (async () => {
    if (!postContent.trim() && postImages.length === 0) return;
    if (!(await ensureRegisteredAccount("登录或注册后即可发帖"))) return;
    addPost(postContent.trim(), postImages);
    setPostContent("");
    setPostImages([]);
    refresh();
    })();
  };

  const renderPostList = (list: CommunityPost[], empty: string) => (
    list.length === 0 ? (
      <p className="py-8 text-center text-xs text-app-muted">{empty}</p>
    ) : (
      <div className="space-y-2">
        {list.map((post) => (
          <Link key={post.id} href={`/community/user/${post.userId}`} className="block app-card !p-3">
            {post.content && <p className="text-xs text-app-text">{post.content}</p>}
            {(post.images?.length ?? 0) > 0 && (
              <p className="mt-1 text-[10px] text-app-accent">📷 {post.images!.length} 张图片</p>
            )}
            <p className="mt-1 text-[10px] text-app-muted">{timeAgo(post.createdAt)} · {post.likes} 赞 · {post.commentCount} 评论</p>
          </Link>
        ))}
      </div>
    )
  );

  const renderUserList = (list: { id: string; nickname: string; avatar: string; verified?: boolean }[], empty: string) => (
    list.length === 0 ? (
      <p className="py-8 text-center text-xs text-app-muted">{empty}</p>
    ) : (
      <div className="space-y-2">
        {list.map((u) => (
          <Link key={u.id} href={`/community/user/${u.id}`} className="flex items-center gap-3 app-card !p-3">
            <UserAvatar userId={u.id} avatar={u.avatar} size="md" verified={u.verified} />
            <div>
              <p className="text-sm font-medium text-app-text">{u.nickname}</p>
              <p className="text-[10px] text-app-muted">{u.id}</p>
            </div>
          </Link>
        ))}
      </div>
    )
  );

  return (
    <>
    <div className="px-4 pb-4">
      <Link href="/community" className="mb-3 inline-flex items-center gap-1 text-xs text-app-accent">
        <ChevronLeft className="h-4 w-4" /> 返回社区
      </Link>

      <header className="mb-4">
        <h1 className="page-title">个人中心</h1>
        <p className="text-xs text-app-muted">管理你的社区内容与互动</p>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button onClick={() => setTab("following")}
          className={`app-card !p-3 text-left ${tab === "following" ? "ring-1 ring-app-accent" : ""}`}>
          <p className="text-2xl font-bold text-app-accent">{following.length}</p>
          <p className="text-[11px] text-app-muted">我的关注</p>
        </button>
        <button onClick={() => setTab("fans")}
          className={`app-card !p-3 text-left ${tab === "fans" ? "ring-1 ring-app-gold" : ""}`}>
          <p className="text-2xl font-bold text-app-gold">{fans.length}</p>
          <p className="text-[11px] text-app-muted">我的粉丝</p>
        </button>
      </div>

      <nav className="mb-4 overflow-hidden rounded-xl border border-app-border">
        {MENU_TABS.map(({ id, label, icon: Icon }) => {
          const count = countFor(id);
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex w-full items-center gap-3 border-b border-app-border px-4 py-3 text-left last:border-b-0 ${
                tab === id ? "bg-app-accent/10" : "hover:bg-app-bg/50"
              }`}
            >
              <Icon className={`h-4 w-4 ${tab === id ? "text-app-accent" : "text-app-muted"}`} />
              <span className={`flex-1 text-sm ${tab === id ? "font-medium text-app-text" : "text-app-muted"}`}>
                {label}
              </span>
              {count > 0 && (
                <span className="rounded-full bg-app-border px-2 py-0.5 text-[10px] text-app-muted">{count}</span>
              )}
            </button>
          );
        })}
        <Link href="/community/messages"
          className="flex w-full items-center gap-3 border-t border-app-border px-4 py-3 text-left hover:bg-app-bg/50">
          <MessageCircle className="h-4 w-4 text-app-accent" />
          <span className="flex-1 text-sm text-app-muted">私信聊天</span>
          <span className="text-[10px] text-app-accent">进入 →</span>
        </Link>
        <button
          type="button"
          onClick={() => setMatchOpen(true)}
          className="flex w-full items-center gap-3 border-t border-app-border px-4 py-3 text-left hover:bg-app-bg/50"
        >
          <Heart className="h-4 w-4 text-app-gold" />
          <span className="flex-1 text-sm text-app-muted">宠物配对</span>
          <span className="text-[10px] text-app-gold">即将上线</span>
        </button>
      </nav>

      {tab === "posts" && (
        <>
          <CommunityComposeBox
            content={postContent}
            images={postImages}
            onContentChange={setPostContent}
            onImagesChange={setPostImages}
            onSubmit={handlePost}
            compact
          />
          <div className="mt-4">{renderPostList(posts, "你还没有发布帖子")}</div>
        </>
      )}

      {tab === "favorites" && renderPostList(favorites, "暂无收藏")}
      {tab === "reposts" && renderPostList(reposts, "暂无转发")}
      {tab === "fans" && renderUserList(fans, "暂无粉丝，多发帖吸引关注吧")}
      {tab === "following" && renderUserList(following, "还没有关注任何人")}

      {tab === "comments" && (
        comments.length === 0 ? (
          <p className="py-8 text-center text-xs text-app-muted">暂无评论</p>
        ) : (
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="app-card !p-3">
                {c.content && <p className="text-xs text-app-text">{c.content}</p>}
                {c.imageUrl && <img src={c.imageUrl} alt="" className="mt-2 max-h-32 rounded-lg object-cover" />}
                <p className="mt-1 text-[10px] text-app-muted">{timeAgo(c.createdAt)}</p>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "messages" && (
        messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-app-muted">暂无消息</p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg: AppMessage) => (
              <div key={msg.id} className="app-card !p-3">
                <p className="text-xs font-medium text-app-text">{msg.title}</p>
                <p className="mt-1 text-[11px] text-app-muted">{msg.content}</p>
                <p className="mt-1 text-[10px] text-app-muted">{timeAgo(msg.createdAt)}</p>
                {msg.type === "dm_request" && msg.relatedUserId && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href={`/community/messages?with=${msg.relatedUserId}`}
                      className="rounded-lg bg-app-accent px-2 py-1 text-[10px] text-white">进入聊天</Link>
                    <button onClick={() => { acceptDmFrom(msg.relatedUserId!); refresh(); }}
                      className="rounded-lg border border-app-accent px-2 py-1 text-[10px] text-app-accent">同意</button>
                    <button onClick={() => { rejectDmFrom(msg.relatedUserId!); refresh(); }}
                      className="rounded-lg border border-app-border px-2 py-1 text-[10px] text-app-muted">拒绝</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
    <ComingSoonModal open={matchOpen} onClose={() => setMatchOpen(false)} title="宠物配对" />
    </>
  );
}
