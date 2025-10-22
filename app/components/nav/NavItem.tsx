import Link from "next/link";

interface INavItem {
  title: string;
  href: string;
  additionalStyle?: string;
}

export default function NavItem({ title, href, additionalStyle }: INavItem) {
  return (
    <Link
      href={href}
      className={`text-white text-shadow-2xs hover:text-blue-600 font-medium transition-colors ${additionalStyle || ""}`}
    >
      {title}
    </Link>
  );
}
