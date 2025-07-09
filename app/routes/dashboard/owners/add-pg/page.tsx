import React, { Suspense } from "react";
import AddNewPG from "./AddNewPG";

const page = () => {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <AddNewPG />
    </Suspense>
  );
};

export default page;
