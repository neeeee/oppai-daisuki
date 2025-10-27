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
      className={`text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors ${additionalStyle || ""}`}
    >
      {title}
    </Link>
  );
}
