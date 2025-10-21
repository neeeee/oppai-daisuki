interface INavItem {
  title: string;
  additionalStyle?: string;
}

export default function NavItem(props: INavItem) {
  return (
    <div>
      <span>{props.title}</span>
    </div>
  );
}
