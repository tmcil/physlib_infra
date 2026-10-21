--
-- PostgreSQL database dump
--

\restrict 1757hXdRpuoh0aXpQWmOdZ9DS3kWsPUcfumyrMWxYvCe1JItKxlgAbtzDb1YfEu

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.6 (Ubuntu 18.6-1.pgdg24.04+2)

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
-- Name: executionstatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.executionstatus AS ENUM (
    'CREATED',
    'RUNNING',
    'SUCCESS',
    'WARNING',
    'FAILED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status public.executionstatus DEFAULT 'CREATED'::public.executionstatus NOT NULL,
    block_graph jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(255) DEFAULT ''::character varying NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id uuid NOT NULL,
    email character varying(320) NOT NULL,
    hashed_password character varying(1024) NOT NULL,
    is_active boolean NOT NULL,
    is_superuser boolean NOT NULL,
    is_verified boolean NOT NULL
);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: executions executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executions
    ADD CONSTRAINT executions_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: ix_executions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_executions_user_id ON public.executions USING btree (user_id);


--
-- Name: ix_user_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_user_email ON public."user" USING btree (email);


--
-- Name: executions fk_executions_user_id_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executions
    ADD CONSTRAINT fk_executions_user_id_user FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 1757hXdRpuoh0aXpQWmOdZ9DS3kWsPUcfumyrMWxYvCe1JItKxlgAbtzDb1YfEu

