"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import { Search, ShoppingCart, User, Menu, X, ChevronDown, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useCart } from "@/app/providers/CartProvider";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import type { Menu as MenuType } from "@/lib/api/menus";

const containerClass = "max-w-[1600px] mx-auto px-4 lg:px-6";

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }

  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f3f4f6;
  }

  /* Hide scrollbar for cleaner look but keep functionality */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// -----------------------------
// Types
// -----------------------------

interface HeaderClientProps {
  menus: MenuType[];
}

// -----------------------------
// User Button Component
// -----------------------------

function UserButton() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (!session?.user) {
    return (
      <Link href="/login" aria-label="Tài khoản" className="hidden sm:inline-flex">
        <User className="h-6 w-6" />
      </Link>
    );
  }

  return (
    <div className="relative hidden sm:block" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 rounded-full border px-3 py-1.5 hover:bg-gray-50"
        aria-label="User menu"
      >
        <User className="h-5 w-5" />
        <span className="text-sm font-medium">{session.user.name?.split(' ')[0] || 'User'}</span>
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-white shadow-lg"
          >
            <div className="p-2">
              <Link
                href="/account"
                className="block rounded px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => setShowMenu(false)}
              >
                Tài khoản
              </Link>
              <Link
                href="/favorites"
                className="block rounded px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => setShowMenu(false)}
              >
                Yêu thích
              </Link>
              <Link
                href="/orders"
                className="block rounded px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => setShowMenu(false)}
              >
                Đơn hàng
              </Link>
              <button
                onClick={handleLogout}
                className="w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -----------------------------
// Cart Button Component
// -----------------------------

function CartButton() {
  const { count } = useCart();

  return (
    <Link href="/cart" className="relative" aria-label="Giỏ hàng">
      <ShoppingCart className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

// -----------------------------
// Search Component
// -----------------------------

function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <>
      {/* Desktop Search */}
      <form onSubmit={handleSearch} className="hidden md:block relative w-full max-w-md">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          className="w-full rounded-full border bg-white/90 px-4 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
          <Search className="h-5 w-5 text-gray-400" />
        </button>
      </form>

      {/* Mobile Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 md:hidden"
        aria-label="Tìm kiếm"
      >
        <Search className="h-6 w-6" />
      </button>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 md:hidden"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              className="bg-white p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                >
                  Tìm
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2"
                >
                  <X className="h-6 w-6" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// -----------------------------
// Mega Menu Component
// -----------------------------

function MegaMenu({ menu, onClose, allMenus }: { menu: MenuType; onClose: () => void; allMenus: MenuType[] }) {
  if (!menu.children || menu.children.length === 0) return null;

  // Server already sorted children by order
  const children = menu.children;

  // Calculate number of columns based on children count
  const childrenCount = children.length;
  const columns = Math.min(childrenCount, 5); // Max 5 columns

  const isMenuLevel3 = children[0]?.children && children[0]?.children.length > 0;

  const renderMenuLevel3 = useMemo(() => {
    if (isMenuLevel3) {
      return children?.map((child) => {
        return (
          <div key={child.id} className="min-w-0">
            <Link
              href={buildSlugPath(child, allMenus)}
              className="mb-4 block text-sm font-semibold text-gray-500 hover:text-emerald-600 transition-colors uppercase tracking-wide"
              onClick={onClose}
            >
              {child.name}
            </Link>
            {child.children && child.children.length > 0 && (
              <ul className="space-y-2.5">
                {child.children.map((grandchild) => (
                  <li key={grandchild.id}>
                    <Link
                      href={buildSlugPath(grandchild, allMenus)}
                      className="text-sm text-gray-400 hover:text-emerald-600 hover:translate-x-1 transition-all block"
                      onClick={onClose}
                      title={grandchild.name}
                    >
                      {grandchild.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      });
    }

    return (
      <ul className="space-y-2.5">
        {children?.map((grandchild) => (
          <li key={grandchild.id}>
            <Link
              href={buildSlugPath(grandchild, allMenus)}
              className="text-sm text-gray-400 hover:text-emerald-600 hover:translate-x-1 transition-all block"
              onClick={onClose}
              title={grandchild.name}
            >
              {grandchild.name}
            </Link>
          </li>
        ))}
      </ul>
    )

  }, [isMenuLevel3, children, allMenus, onClose]);

  return (
    <div className="border-t bg-white shadow-xl">
      <div className={clsx(containerClass, "py-10")}>
        {/* Grid layout for mega menu - vertical scroll if needed */}
        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
          <div
            className="inline-grid gap-x-12 gap-y-8 auto-cols-max"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(220px, 280px))`,
            }}
          >
            {renderMenuLevel3}
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Main Header Client Component
// -----------------------------

// Helper function to build slug path from menu item
function buildSlugPath(item: MenuType, allMenus: MenuType[]): string {
  const slugs: string[] = [item.slug];
  let current = item;
  
  // Build path from child to parent
  while (current.parentId) {
    const parent = findMenuById(current.parentId, allMenus);
    if (parent) {
      slugs.unshift(parent.slug);
      current = parent;
    } else {
      break;
    }
  }
  
  return `/categories/${slugs.join("/")}`;
}

// Helper function to find menu by id
function findMenuById(id: string, menus: MenuType[]): MenuType | undefined {
  for (const menu of menus) {
    if (menu.id === id) return menu;
    if (menu.children) {
      const found = findMenuById(id, menu.children);
      if (found) return found;
    }
  }
  return undefined;
}

// Mobile Menu Item Component
function MobileMenuItem({
  item,
  level = 0,
  onClose,
  allMenus,
}: {
  item: MenuType;
  level?: number;
  onClose: () => void;
  allMenus: MenuType[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between py-1">
        <Link
          href={buildSlugPath(item, allMenus)}
          className={clsx(
            "flex-1 px-2 py-1.5 transition-colors hover:text-emerald-600 rounded",
            level === 0 && "font-semibold text-gray-900",
            level === 1 && "text-sm text-gray-700",
            level === 2 && "text-xs text-gray-600",
          )}
          onClick={onClose}
        >
          {item.name}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 p-1 hover:bg-gray-100 rounded"
            aria-label="Toggle submenu"
          >
            <ChevronDown
              className={clsx(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </button>
        )}
      </div>

      {hasChildren && isExpanded && item.children && (
        <div className={clsx("space-y-2", level === 0 ? "pl-6" : "pl-4")}>
          {item.children.map((child) => (
            <MobileMenuItem
              key={child.id}
              item={child}
              level={level + 1}
              onClose={onClose}
              allMenus={allMenus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HeaderClient({ menus }: HeaderClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setHoveredMenu(null);
  }, [pathname]);

  // Filter root menus (server already sorted by order)
  const rootMenus = menus.filter(menu => !menu.parentId);

  return (
    <>
      {/* Inject custom scrollbar styles */}
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />

      <header className={clsx("sticky top-0 z-50 bg-white", scrolled && "shadow-md")}>
        {/* Promo Bar */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center py-2 text-sm">
          <div className={containerClass}>
            🌿 Miễn phí vận chuyển cho đơn từ 499k
          </div>
        </div>

      {/* Main Header */}
      <div className="border-b" onMouseLeave={() => setHoveredMenu(null)}>
        <div className={clsx(containerClass, "flex items-center justify-between gap-4")}>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/icons/logo-icon.svg"
              alt="Losia"
              width={120}
              height={40}
              priority
            />
          </Link>

          {/* Desktop Navigation - 2 Rows Layout */}
          <div className="hidden lg:flex flex-col gap-2 flex-1 justify-center py-3">
            {/* Row 1: Main Categories */}
            <nav className="flex items-center justify-center gap-4">
              {rootMenus.slice(0, 6).map((menu) => (
                <div
                  key={menu.id}
                  onMouseEnter={() => setHoveredMenu(menu.id)}
                  className="relative"
                >
                  <Link
                    href={`/categories/${menu.slug}`}
                    className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors whitespace-nowrap px-2 py-1"
                  >
                    {menu.name}
                    {menu.children && menu.children.length > 0 && (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Link>
                </div>
              ))}
            </nav>

            {/* Row 2: Secondary Categories + Actions */}
            <div className="flex items-center justify-center gap-4">
              {/* Remaining Categories */}
              {rootMenus.slice(6, 10).map((menu) => (
                <div
                  key={menu.id}
                  onMouseEnter={() => setHoveredMenu(menu.id)}
                  className="relative"
                >
                  <Link
                    href={`/categories/${menu.slug}`}
                    className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors whitespace-nowrap px-2 py-1"
                  >
                    {menu.name}
                    {menu.children && menu.children.length > 0 && (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Link>
                </div>
              ))}

              {/* Divider */}
              <div className="h-5 w-px bg-gray-300" />

              {/* Additional Links */}
              <Link
                href="/products"
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors whitespace-nowrap px-2 py-1"
              >
                Tất cả sản phẩm
              </Link>

              <Link
                href="/shop"
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors whitespace-nowrap px-2 py-1"
              >
                Shop
              </Link>

              <Link
                href="/sell-with-us"
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors whitespace-nowrap shadow-sm hover:shadow-md"
              >
                Bán hàng
              </Link>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <SearchBar />
            <UserButton />
            <CartButton />
          </div>
        </div>

        {/* Desktop Mega Menu */}
        <AnimatePresence>
          {hoveredMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full"
            >
              {rootMenus.map((menu) =>
                menu.id === hoveredMenu ? (
                  <MegaMenu
                    key={menu.id}
                    menu={menu}
                    onClose={() => setHoveredMenu(null)}
                    allMenus={menus}
                  />
                ) : null
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b bg-white lg:hidden overflow-hidden"
          >
            {/* Scrollable mobile menu with max height */}
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-4">
                {/* Category Menus */}
                {rootMenus.map((menu) => (
                  <MobileMenuItem
                    key={menu.id}
                    item={menu}
                    onClose={() => setMobileOpen(false)}
                    allMenus={menus}
                  />
                ))}

                {/* Divider */}
                <div className="border-t my-4" />

                {/* Additional Links */}
                <div className="space-y-2">
                  <Link
                    href="/products"
                    className="block px-2 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50 rounded transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Tất cả sản phẩm
                  </Link>

                  <Link
                    href="/favorites"
                    className="block px-2 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50 rounded transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Yêu thích
                  </Link>

                  <Link
                    href="/shop"
                    className="block px-2 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50 rounded transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Shop
                  </Link>
                </div>

                {/* CTA Button */}
                <Link
                  href="/sell-with-us"
                  className="block rounded-lg bg-emerald-600 px-6 py-3 text-center font-semibold text-white hover:bg-emerald-700 transition-colors mt-4"
                  onClick={() => setMobileOpen(false)}
                >
                  Bán với chúng tôi
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </header>
    </>
  );
}

