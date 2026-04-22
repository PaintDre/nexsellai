-- Allow anonymous (logged-out) and authenticated visitors to read the public banner showcase view
GRANT SELECT ON public.public_banner_showcase TO anon, authenticated;

-- Same for the public_landings view (used in the examples gallery on the home page)
GRANT SELECT ON public.public_landings TO anon, authenticated;