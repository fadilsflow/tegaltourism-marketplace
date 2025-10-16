
import Link from 'next/link'

export default function Footer() {

  const links = [
    {
      title: 'Toko',
      href: '/stores',
    },
    {
      title: 'Produk',
      href: '/products',
    },
    {
      title: 'About',
      href: '/#about',
    },
  ]
  return (
    <footer className="border-b py-12 dark:bg-transparent">
      <div className="mx-auto container px-6 md:px-12">
        <div className="flex flex-wrap justify-between gap-6">
          <span className="text-muted-foreground order-last block text-center text-sm md:order-first">&copy; {new Date().getFullYear()} Jejak Rempah Marketplace</span>
          <div className="order-first flex flex-wrap justify-center gap-6 text-sm md:order-last">
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-muted-foreground hover:text-primary block duration-150">
                <span>{link.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}