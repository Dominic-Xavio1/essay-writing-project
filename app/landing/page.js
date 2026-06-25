'use client';

import Link from 'next/link';
import { Heart, BookMarked, TrendingUp, Share2, MessageSquare, Sparkles } from 'lucide-react';
import Image from 'next/image';
import {motion} from 'framer-motion';
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top bar with contact info */}
          {/* <div className="py-3 border-b border-border hidden sm:block">
            <div className="flex items-center justify-between text-xs text-foreground/70">
              <div className="flex items-center gap-6">
                <span>support@essayhub.com</span>
                <span>1-800-ESSAY-HUB</span>
              </div>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-primary transition-colors">f</a>
                <a href="#" className="hover:text-primary transition-colors">tw</a>
                <a href="#" className="hover:text-primary transition-colors">in</a>
                <a href="#" className="hover:text-primary transition-colors">ig</a>
              </div>
            </div>
          </div> */}

          {/* Main nav */}
          <nav className="h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
                <Image src="/agahozo.png" alt="EssayHub" width={53} height={53} />
              <span className="font-bold text-foreground">EssayHub</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/posts" className="text-foreground/80 hover:text-foreground text-sm font-medium transition-colors">
                Explore
              </Link>
              <Link href="#features" className="text-foreground/80 hover:text-foreground text-sm font-medium transition-colors">
                Features
              </Link>
              <Link href="#about" className="text-foreground/80 hover:text-foreground text-sm font-medium transition-colors">
                About
              </Link>
              <Link href="#" className="text-foreground/80 hover:text-foreground text-sm font-medium transition-colors">
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-foreground/80 hover:text-foreground text-sm font-medium transition-colors hidden sm:block">
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-5 py-2 bg-accent text-primary-foreground rounded-lg text-sm font-semibold hover:bg-accent/90 transition-colors"
              >
                Start Free
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section - Template Inspired */}
      <section className="bg-secondary/50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white mb-8 border border-border">
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">Write at Warp Speed</span>
              </div>

              <div className="relative group">
                <motion.div
                  initial={{ opacity: 0.8, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-5xl sm:text-6xl font-bold text-foreground leading-tight mb-6 relative overflow-hidden"
                >
                  <span className="relative z-10">Publishing is king in the digital age</span>
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 0.05,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-r from-transparent via-white/80 to-transparent mix-blend-screen"
                  />
                </motion.div>
              </div>

              <p className="text-lg text-foreground/70 leading-relaxed mb-8 max-w-lg">
                EssayHub empowers writers to share their voice with the world. Craft stunning essays with our advanced editor, reach engaged readers, and build your writing legacy.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/create"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  Start Writing
                </Link>
                <Link
                  href="/posts"
                  className="inline-flex items-center justify-center px-6 py-3 bg-accent text-primary-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors"
                >
                  Explore Now
                </Link>
              </div>
            </div>

            {/* Right - Visual Preview */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-xl">
               <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="relative h-88 w-[700px]">
    <Image 
      src="/club.webp" 
      alt="Essay Preview" 
      fill // Tells Next.js to fill the parent container
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    className="object-cover object-top"
      priority
    />
  </div>
  <div className="p-6">
    <p className="text-xs font-semibold text-accent/80 mb-2 uppercase tracking-wide">Featured Essay</p>
    <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
      The Future of Remote Work
    </h3>
    <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
      Exploring how distributed teams are reshaping the landscape of modern work and collaboration.
    </p>
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <span className="text-xs text-foreground/60">8 min read</span>
      <div className="flex items-center gap-3">
        <Heart className="w-4 h-4 text-foreground/40 hover:text-accent cursor-pointer transition-colors" />
        <Share2 className="w-4 h-4 text-foreground/40 hover:text-primary cursor-pointer transition-colors" />
      </div>
    </div>
  </div>
</div>


                {/* Floating card */}
                <div className="absolute -bottom-6 -right-6 bg-white rounded-lg p-4 shadow-lg hidden sm:block">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    <div className="text-sm">
                      <p className="font-semibold text-foreground">50K Essays</p>
                      <p className="text-foreground/60 text-xs">Published this month</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 sm:mb-20">
            <p className="text-sm font-semibold text-accent/80 uppercase tracking-widest mb-4">CORE FEATURES</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Everything you need to write
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl">
              A complete suite of tools designed for writers who want to create, publish, and succeed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {/* Feature Card 1 */}
            <div className="flex  gap-4 px-2 py-4 bg-white rounded-lg border border-border hover:shadow-lg transition-shadow">
              <Image src="/giphy2.gif" alt="Editor Icon" width={150} height={100} className="object-cover border border-border rounded-lg" />
              
              
              <div className="text-foreground/70 text-sm leading-relaxed">
              <h3 className="text-xl font-bold text-foreground">Rich Text Engine</h3>
              <p>Break free from boring text! Unleash total creative control over your words with lightning-fast bolding, sharp italics, hyper-vibrant colors, and explosive formatting.</p>  
              </div>
            </div>

            {/* Feature Card 2 */}
               <div className="flex  gap-4 px-2 py-4 bg-white rounded-lg border border-border hover:shadow-lg transition-shadow">
              <Image src="/giphy1.gif" alt="Editor Icon" width={150} height={100} className="object-cover border border-border rounded-lg" />
              
              
              <div className="text-foreground/70 text-sm leading-relaxed">
              <h3 className="text-xl font-bold text-foreground">Community Engagement</h3>
              <p>Connect with readers, build a loyal audience, and foster meaningful discussions around your work.</p>  
              </div>
            </div>

            {/* Feature Card 3 */}
               <div className="flex  gap-4 px-2 py-4 bg-white rounded-lg border border-border hover:shadow-lg transition-shadow">
              <Image src="/giphy3.gif" alt="Editor Icon" width={150} height={100} className="object-cover border border-border rounded-lg" />
              
              
              <div className="text-foreground/70 text-sm leading-relaxed">
              <h3 className="text-xl font-bold text-foreground">Analytics Dashboard</h3>
              <p> Track reads, engagement, and audience growth with real-time insights into your essay performance.</p>  
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - Alternating Layout */}
      <section id="about" className="py-20 sm:py-32 bg-secondary/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Image/Visual */}
           
            <Image
              src="/giphy.gif"
              alt="Reading Habit"
              width={600}
              height={400}
              className="rounded-lg shadow-lg object-cover object-top"
            />

            {/* Right - Content */}
            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold text-accent/80 uppercase tracking-widest mb-4">ABOUT</p>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                Built for writers, by writers
              </h2>
              <p className="text-lg text-foreground/70 leading-relaxed mb-6">
                EssayHub was created by writers who experienced the limitations of existing platforms. We built the editor we always wanted - powerful yet intuitive, with all the formatting tools you need without unnecessary complexity.
              </p>
              <p className="text-lg text-foreground/70 leading-relaxed mb-8">
                Whether you're sharing personal stories, professional insights, or creative fiction, EssayHub provides the tools to craft your best work and reach an audience that genuinely cares.
              </p>

              <div className="flex items-center gap-6 pt-8 border-t border-border">
                <div>
                  <p className="text-3xl font-bold text-primary">2.5K+</p>
                  <p className="text-sm text-foreground/70">Active Writers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-accent">50K+</p>
                  <p className="text-sm text-foreground/70">Essays Published</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">500K+</p>
                  <p className="text-sm text-foreground/70">Monthly Readers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-primary text-primary-foreground py-20 sm:py-28 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to publish your first essay?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 leading-relaxed">
            Join thousands of writers creating meaningful content and building their audience on EssayHub.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center px-8 py-3 bg-primary-foreground text-primary rounded-lg font-semibold hover:bg-primary-foreground/90 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="bg-background border-t border-border py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-bold text-foreground mb-4 text-sm">PRODUCT</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-foreground/70 hover:text-foreground text-sm transition-colors">Features</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground text-sm transition-colors">Pricing</Link></li>
                <li><Link href="/posts" className="text-foreground/70 hover:text-foreground text-sm transition-colors">Explore Essays</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4 text-sm">COMMUNITY</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-foreground/70 hover:text-foreground text-sm transition-colors">Writers</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground text-sm transition-colors">Categories</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground text-sm transition-colors">Trending</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4 text-sm">RESOURCES</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-foreground/70 hover:text-foreground text-sm transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground text-sm transition-colors">Help Center</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground text-sm transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4 text-sm">LEGAL</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-foreground/70 hover:text-foreground text-sm transition-colors">Privacy</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground text-sm transition-colors">Terms</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground text-sm transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  E
                </div>
                <span className="font-bold text-foreground">EssayHub</span>
              </div>
              <p className="text-foreground/70 text-sm">© 2026 EssayHub. All rights reserved. | Best writing platform on the web</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
