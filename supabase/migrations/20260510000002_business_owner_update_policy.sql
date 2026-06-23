-- Allow business owners and business_admin members to update their own business settings
CREATE POLICY "Owners can update own business" ON public.businesses
  FOR UPDATE USING (
    auth.uid() = owner_id
    OR id = public.get_user_business_id(auth.uid())
  );
