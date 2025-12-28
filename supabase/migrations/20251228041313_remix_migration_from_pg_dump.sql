CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;


--
-- Name: update_follow_counts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_follow_counts() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following_count for follower
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE user_id = NEW.follower_id;
    
    -- Increment followers_count for following
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE user_id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following_count for follower
    UPDATE public.profiles 
    SET following_count = GREATEST(following_count - 1, 0)
    WHERE user_id = OLD.follower_id;
    
    -- Decrement followers_count for following
    UPDATE public.profiles 
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE user_id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_outfit_comments_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_outfit_comments_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shared_outfits 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.outfit_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.shared_outfits 
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.outfit_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_outfit_likes_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_outfit_likes_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shared_outfits 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.outfit_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.shared_outfits 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.outfit_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: category_corrections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_corrections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    image_hash text NOT NULL,
    ai_predicted_category text,
    user_selected_category text NOT NULL,
    image_features jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT follows_check CHECK ((follower_id <> following_id))
);


--
-- Name: hidden_outfits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hidden_outfits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    outfit_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: outfit_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.outfit_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    outfit_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: outfit_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.outfit_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    outfit_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    display_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    followers_count integer DEFAULT 0 NOT NULL,
    following_count integer DEFAULT 0 NOT NULL
);


--
-- Name: saved_outfits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_outfits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    outfit_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shared_outfits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shared_outfits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    result_image_url text NOT NULL,
    clothing_items jsonb DEFAULT '[]'::jsonb NOT NULL,
    likes_count integer DEFAULT 0 NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    comments_count integer DEFAULT 0 NOT NULL
);


--
-- Name: try_on_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.try_on_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    body_image_url text NOT NULL,
    result_image_url text NOT NULL,
    clothing_items jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_favorite boolean DEFAULT false NOT NULL
);


--
-- Name: user_clothing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_clothing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'top'::text NOT NULL,
    image_url text NOT NULL,
    color text,
    gender text,
    style text,
    pattern text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    is_purchased boolean DEFAULT false NOT NULL,
    purchase_url text
);


--
-- Name: user_collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_collections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    cover_image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: category_corrections category_corrections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_corrections
    ADD CONSTRAINT category_corrections_pkey PRIMARY KEY (id);


--
-- Name: follows follows_follower_id_following_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_following_id_key UNIQUE (follower_id, following_id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: hidden_outfits hidden_outfits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hidden_outfits
    ADD CONSTRAINT hidden_outfits_pkey PRIMARY KEY (id);


--
-- Name: hidden_outfits hidden_outfits_user_id_outfit_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hidden_outfits
    ADD CONSTRAINT hidden_outfits_user_id_outfit_id_key UNIQUE (user_id, outfit_id);


--
-- Name: outfit_comments outfit_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outfit_comments
    ADD CONSTRAINT outfit_comments_pkey PRIMARY KEY (id);


--
-- Name: outfit_likes outfit_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outfit_likes
    ADD CONSTRAINT outfit_likes_pkey PRIMARY KEY (id);


--
-- Name: outfit_likes outfit_likes_user_id_outfit_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outfit_likes
    ADD CONSTRAINT outfit_likes_user_id_outfit_id_key UNIQUE (user_id, outfit_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: saved_outfits saved_outfits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_outfits
    ADD CONSTRAINT saved_outfits_pkey PRIMARY KEY (id);


--
-- Name: saved_outfits saved_outfits_user_id_outfit_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_outfits
    ADD CONSTRAINT saved_outfits_user_id_outfit_id_key UNIQUE (user_id, outfit_id);


--
-- Name: shared_outfits shared_outfits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_outfits
    ADD CONSTRAINT shared_outfits_pkey PRIMARY KEY (id);


--
-- Name: try_on_history try_on_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_on_history
    ADD CONSTRAINT try_on_history_pkey PRIMARY KEY (id);


--
-- Name: user_clothing user_clothing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_clothing
    ADD CONSTRAINT user_clothing_pkey PRIMARY KEY (id);


--
-- Name: user_collections user_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_collections
    ADD CONSTRAINT user_collections_pkey PRIMARY KEY (id);


--
-- Name: idx_category_corrections_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_category_corrections_category ON public.category_corrections USING btree (user_selected_category);


--
-- Name: idx_category_corrections_features; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_category_corrections_features ON public.category_corrections USING gin (image_features);


--
-- Name: idx_outfit_likes_outfit_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_outfit_likes_outfit_id ON public.outfit_likes USING btree (outfit_id);


--
-- Name: idx_outfit_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_outfit_likes_user_id ON public.outfit_likes USING btree (user_id);


--
-- Name: idx_shared_outfits_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shared_outfits_featured ON public.shared_outfits USING btree (is_featured, created_at DESC);


--
-- Name: idx_shared_outfits_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shared_outfits_user ON public.shared_outfits USING btree (user_id);


--
-- Name: idx_try_on_history_favorite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_try_on_history_favorite ON public.try_on_history USING btree (user_id, is_favorite);


--
-- Name: idx_user_clothing_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_clothing_category ON public.user_clothing USING btree (category);


--
-- Name: idx_user_clothing_purchased; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_clothing_purchased ON public.user_clothing USING btree (user_id, is_purchased);


--
-- Name: idx_user_clothing_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_clothing_tags ON public.user_clothing USING gin (tags);


--
-- Name: idx_user_clothing_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_clothing_user_id ON public.user_clothing USING btree (user_id);


--
-- Name: user_collections update_collections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.user_collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: outfit_comments update_comments_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comments_count AFTER INSERT OR DELETE ON public.outfit_comments FOR EACH ROW EXECUTE FUNCTION public.update_outfit_comments_count();


--
-- Name: follows update_follow_counts_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_follow_counts_trigger AFTER INSERT OR DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();


--
-- Name: outfit_likes update_likes_count_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_likes_count_trigger AFTER INSERT OR DELETE ON public.outfit_likes FOR EACH ROW EXECUTE FUNCTION public.update_outfit_likes_count();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: shared_outfits update_shared_outfits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_shared_outfits_updated_at BEFORE UPDATE ON public.shared_outfits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hidden_outfits hidden_outfits_outfit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hidden_outfits
    ADD CONSTRAINT hidden_outfits_outfit_id_fkey FOREIGN KEY (outfit_id) REFERENCES public.shared_outfits(id) ON DELETE CASCADE;


--
-- Name: outfit_comments outfit_comments_outfit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outfit_comments
    ADD CONSTRAINT outfit_comments_outfit_id_fkey FOREIGN KEY (outfit_id) REFERENCES public.shared_outfits(id) ON DELETE CASCADE;


--
-- Name: outfit_likes outfit_likes_outfit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outfit_likes
    ADD CONSTRAINT outfit_likes_outfit_id_fkey FOREIGN KEY (outfit_id) REFERENCES public.shared_outfits(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: saved_outfits saved_outfits_outfit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_outfits
    ADD CONSTRAINT saved_outfits_outfit_id_fkey FOREIGN KEY (outfit_id) REFERENCES public.shared_outfits(id) ON DELETE CASCADE;


--
-- Name: try_on_history try_on_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_on_history
    ADD CONSTRAINT try_on_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_collections user_collections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_collections
    ADD CONSTRAINT user_collections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: outfit_comments Anyone can view comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view comments" ON public.outfit_comments FOR SELECT USING (true);


--
-- Name: category_corrections Anyone can view corrections for AI learning; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view corrections for AI learning" ON public.category_corrections FOR SELECT USING (true);


--
-- Name: follows Anyone can view follows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);


--
-- Name: outfit_likes Anyone can view likes count; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view likes count" ON public.outfit_likes FOR SELECT USING (true);


--
-- Name: profiles Anyone can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: shared_outfits Anyone can view shared outfits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view shared outfits" ON public.shared_outfits FOR SELECT USING (true);


--
-- Name: category_corrections Authenticated users can create corrections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create corrections" ON public.category_corrections FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: outfit_comments Users can create comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create comments" ON public.outfit_comments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: shared_outfits Users can create shared outfits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create shared outfits" ON public.shared_outfits FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: outfit_comments Users can delete own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own comments" ON public.outfit_comments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_clothing Users can delete their own clothing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own clothing" ON public.user_clothing FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_collections Users can delete their own collections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own collections" ON public.user_collections FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: shared_outfits Users can delete their own shared outfits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own shared outfits" ON public.shared_outfits FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: try_on_history Users can delete their own try-on history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own try-on history" ON public.try_on_history FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: follows Users can follow others; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK ((auth.uid() = follower_id));


--
-- Name: hidden_outfits Users can hide outfits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can hide outfits" ON public.hidden_outfits FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_clothing Users can insert their own clothing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own clothing" ON public.user_clothing FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_collections Users can insert their own collections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own collections" ON public.user_collections FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: try_on_history Users can insert their own try-on history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own try-on history" ON public.try_on_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: outfit_likes Users can like outfits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can like outfits" ON public.outfit_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: saved_outfits Users can save outfits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can save outfits" ON public.saved_outfits FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: follows Users can unfollow; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING ((auth.uid() = follower_id));


--
-- Name: hidden_outfits Users can unhide outfits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unhide outfits" ON public.hidden_outfits FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: outfit_likes Users can unlike their own likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unlike their own likes" ON public.outfit_likes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: saved_outfits Users can unsave outfits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unsave outfits" ON public.saved_outfits FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_clothing Users can update their own clothing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own clothing" ON public.user_clothing FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_collections Users can update their own collections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own collections" ON public.user_collections FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: shared_outfits Users can update their own shared outfits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own shared outfits" ON public.shared_outfits FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: hidden_outfits Users can view own hidden outfits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own hidden outfits" ON public.hidden_outfits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: saved_outfits Users can view own saved outfits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own saved outfits" ON public.saved_outfits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_clothing Users can view their own clothing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own clothing" ON public.user_clothing FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_collections Users can view their own collections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own collections" ON public.user_collections FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: try_on_history Users can view their own try-on history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own try-on history" ON public.try_on_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: category_corrections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.category_corrections ENABLE ROW LEVEL SECURITY;

--
-- Name: follows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

--
-- Name: hidden_outfits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hidden_outfits ENABLE ROW LEVEL SECURITY;

--
-- Name: outfit_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.outfit_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: outfit_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.outfit_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_outfits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_outfits ENABLE ROW LEVEL SECURITY;

--
-- Name: shared_outfits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shared_outfits ENABLE ROW LEVEL SECURITY;

--
-- Name: try_on_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.try_on_history ENABLE ROW LEVEL SECURITY;

--
-- Name: user_clothing; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_clothing ENABLE ROW LEVEL SECURITY;

--
-- Name: user_collections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;