import Home from "./clientComponents/Home";
import Script from "next/script";
import { Metadata } from "next";

export const metadata: Metadata = {
  verification: {
    google: "sGLhlAT5_HBEp3M6kyWrSTLOkdf5b1MPC11C6uFseXE",
  },
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const resolvedSearchParams = await searchParams;

  const pageParam = resolvedSearchParams.page ?? "1";
  const perPageParam = resolvedSearchParams.per_page ?? "20";

  const page = Math.max(1, Number(pageParam));
  const per_page = Math.min(50, Number(perPageParam));

  return (
    <main className="w-full pb-36 overflow-x-hidden">
      <Script id="clarity-script" strategy="afterInteractive">
        {`
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "vysj57fe51");
        `}
      </Script>
      <Home page={page} per_page={per_page} />
    </main>
  );
};

export default Page;
