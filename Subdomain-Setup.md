 owelign.com              → Repo 1 (your website)                                                                                                                        
  concrete-blocks.owelign.com → Repo 2 (client demo)                                                                                                                      
                                                                                                                                                                          
  Setup process:                                                                                                                                                          

  1. DNS Configuration (GoDaddy/Cloudflare/etc.)
  Add two records:
  A     @           → 76.76.21.21  (Vercel's IP for root domain)
  CNAME concrete-blocks → cname.vercel-dns.com  (for subdomain)

  2. Vercel Projects
  - Project 1: Import Repo 1 → Add domain owelign.com
  - Project 2: Import Repo 2 → Add domain concrete-blocks.owelign.com

  3. Vercel automatically verifies DNS and deploys each repo to its respective domain/subdomain.

  ---
  Important: Both projects point to different repos but share the same parent domain (owelign.com) through DNS configuration. They're completely separate deployments.