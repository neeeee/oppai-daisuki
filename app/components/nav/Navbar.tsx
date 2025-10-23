import NavItem from "./NavItem";

const pages = [
  { title: "Videos", href: "/videos" },
  { title: "Photos", href: "/photos" },
  { title: "Galleries", href: "/galleries" },
  { title: "Idols", href: "/idols" },
  { title: "Genres", href: "/genres" },
  { title: "News", href: "/news" },
];

const Navbar: React.FC = () => {
  return (
    <nav className="bg-black w-full">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center space-x-8">
          <div className="text-xl font-semibold text-white">0π-dsk</div>
          <div className="flex space-x-8">
            {pages.map((page) => (
              <NavItem key={page.title} title={page.title} href={page.href} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
