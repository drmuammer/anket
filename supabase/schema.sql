-- Veritabanı şeması

-- Önce tüm tabloları temizle
DROP TABLE IF EXISTS public.anketler CASCADE;
DROP TABLE IF EXISTS public.sorular CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- RLS politikalarını temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi anketlerini görebilir" ON public.anketler;
DROP POLICY IF EXISTS "Kullanıcılar anket oluşturabilir" ON public.anketler;
DROP POLICY IF EXISTS "Kullanıcılar kendi sorularını görebilir" ON public.sorular;
DROP POLICY IF EXISTS "Kullanıcılar soru ekleyebilir" ON public.sorular;
DROP POLICY IF EXISTS "Adminler tüm rolleri yönetebilir" ON public.user_roles;
DROP POLICY IF EXISTS "Kullanıcılar kendi rollerini görebilir" ON public.user_roles;

-- Anketler tablosu
CREATE TABLE public.anketler (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baslik TEXT NOT NULL,
    aciklama TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sorular tablosu
CREATE TABLE public.sorular (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anket_id UUID REFERENCES public.anketler(id) ON DELETE CASCADE,
    soru TEXT NOT NULL,
    tip TEXT NOT NULL CHECK (tip IN ('text', 'radio', 'checkbox')),
    secenekler TEXT[],
    sira INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Kullanıcı rolleri tablosu
CREATE TABLE public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS politikalarını etkinleştir
ALTER TABLE public.anketler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorular ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Anketler için RLS politikaları
CREATE POLICY "Kullanıcılar kendi anketlerini görebilir"
ON public.anketler FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar anket oluşturabilir"
ON public.anketler FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Sorular için RLS politikaları
CREATE POLICY "Kullanıcılar kendi sorularını görebilir"
ON public.sorular FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.anketler
    WHERE anketler.id = sorular.anket_id
    AND anketler.user_id = auth.uid()
));

CREATE POLICY "Kullanıcılar soru ekleyebilir"
ON public.sorular FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.anketler
    WHERE anketler.id = anket_id
    AND anketler.user_id = auth.uid()
));

-- Kullanıcı rolleri için RLS politikaları
CREATE POLICY "Adminler tüm rolleri yönetebilir"
ON public.user_roles FOR ALL
USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

CREATE POLICY "Kullanıcılar kendi rollerini görebilir"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- İlk admin kullanıcısını ekle (kendi kullanıcı ID'nizi buraya yazın)
INSERT INTO public.user_roles (user_id, role)
VALUES ('f8891275-ccba-41a8-86f0-2e8ab212c242', 'admin'); 