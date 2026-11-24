export type ArticleStatus = "draft" | "published" | "archived";

export interface KbArticle {
  id: number;
  title: string;
  content: string;
  category_id: number | null;
  tags: string[];
  status: ArticleStatus;
  view_count: number;
  author_id: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // relations
  category?: KbCategory;
  author?: { id: number; full_name: string };
}

export interface KbCategory {
  id: number;
  category_name: string;
  parent_id: number | null;
  children?: KbCategory[];
}
