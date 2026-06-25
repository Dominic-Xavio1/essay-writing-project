'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-4">EssayHub</h3>
            <p className="text-sm text-muted-foreground">
              A platform for sharing thoughtful essays and engaging with writers from around the world.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Product</h4>
            <div className="space-y-2">
              <Link href="/posts" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                Explore Essays
              </Link>
              <Link href="/create" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                Write Essay
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                Pricing
              </Link>
            </div>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Community</h4>
            <div className="space-y-2">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                Blog
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                Forums
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                Events
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
            <div className="space-y-2">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                Terms
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                Contact
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 EssayHub. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="text-sm">Twitter</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="text-sm">LinkedIn</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="text-sm">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
