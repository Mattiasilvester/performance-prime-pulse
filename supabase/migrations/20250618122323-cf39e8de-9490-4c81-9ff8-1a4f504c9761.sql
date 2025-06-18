
-- Create enum types
CREATE TYPE public.user_category AS ENUM ('amatori', 'atleti', 'agonisti');
CREATE TYPE public.professional_category AS ENUM ('fisioterapista', 'nutrizionista', 'mental_coach', 'osteopata', 'pt');

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    payment_method TEXT,
    category user_category NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    reset_token TEXT,
    reset_requested_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create professionals table
CREATE TABLE public.professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    birth_place VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    vat_number VARCHAR(50) NOT NULL,
    vat_address TEXT NOT NULL,
    vat_postal_code VARCHAR(20) NOT NULL,
    vat_city VARCHAR(100) NOT NULL,
    sdi_code VARCHAR(50),
    email VARCHAR(255) NOT NULL UNIQUE,
    pec_email VARCHAR(255),
    phone VARCHAR(30) NOT NULL,
    office_phone VARCHAR(30),
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    reset_token TEXT,
    reset_requested_at TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    category professional_category NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_professionals_email ON public.professionals(email);
CREATE INDEX idx_users_category ON public.users(category);
CREATE INDEX idx_professionals_category ON public.professionals(category);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at
    BEFORE UPDATE ON public.professionals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (users can only see their own data)
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Professionals can view their own data" ON public.professionals
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Professionals can update their own data" ON public.professionals
    FOR UPDATE USING (id = auth.uid());

-- Allow public read access to professionals for discovery (users can browse professionals)
CREATE POLICY "Allow public read access to professionals" ON public.professionals
    FOR SELECT TO authenticated USING (true);
