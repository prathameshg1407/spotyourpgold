import { IconArrowUpRight, IconHeart } from "@tabler/icons-react";

export default function Skeleton() {
  return (
    <div className="bg-dark-charcoal cursor-pointer select-none border-4 border-outline rounded-xl border-opacity-15 overflow-hidden w-full hover:border-opacity-50 transition-colors duration-150 ease-in group @container min-w-[250px] max-w-[300px]">
      <div className="bg-su flex relative items-center justify-center   rounded-b-2xl">
        <div className="w-full h-44 bg-gray-100 animate-pulse overflow-hidden "></div>

        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800/30 bg-opacity-25 p-3 rounded-xl backdrop-blur-2xl">
          <IconArrowUpRight className="  text-white  w-7 h-7 " />
        </div>
      </div>

      <div className="p-4 font-inter relative ">
        <div className="absolute top-2 right-2 z-10  p-1 hover:scale-125 transition">
          <IconHeart className="h-5 w-5 text-gray-400 animate-bounce cursor-pointer " />
        </div>

        <p className="text-xs animate-pulse uppercase text-gray-400 dark:text-gray-400">
          Loading...
        </p>

        <h5 className="text-lg font-semibold animate-pulse text-HG-900 dark:text-white py-1">
          Loading...
        </h5>

        <p className="text-sm text-gray-500 animate-pulse dark:text-gray-300">
          Loading...
        </p>

        <p className="text-2xl font-bold animate-pulse font-poppins text-HG-400 pt-4">
          Loading...
        </p>
      </div>
    </div>
  );
}
