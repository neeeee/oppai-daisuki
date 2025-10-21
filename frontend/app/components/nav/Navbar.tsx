const Navbar: React.FC = () => {
  return (
    <nav className="bg-black w-full">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center space-x-8">
          <div className="text-xl font-semibold text-white">0π-dsk</div>
          <div className="flex space-x-8">
            <a
              href="#videos"
              className="text-white text-shadow-2xs hover:text-blue-600 font-medium transition-colors"
            >
              Videos
            </a>
            <a
              href="#photos"
              className="text-white text-shadow-2xs hover:text-blue-600 font-medium transition-colors"
            >
              Photos
            </a>
            <a
              href="#models"
              className="text-white text-shadow-2xs hover:text-blue-600 font-medium transition-colors"
            >
              Models
            </a>
            <a
              href="#genre"
              className="text-white text-shadow-2xs hover:text-blue-600 font-medium transition-colors"
            >
              Genre
            </a>
            <a
              href="#news"
              className="text-white text-shadow-2xs hover:text-blue-600 font-medium transition-colors"
            >
              News
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
