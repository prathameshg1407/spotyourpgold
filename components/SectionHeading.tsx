import React from "react";

const SectionHeading = ({
  children,
  rightSide,
}: {
  children: React.ReactNode;
  rightSide?: React.ReactNode;
}) => {
  return (
    <div className="w-full  flex justify-between gap-2 items-start md:items-center">
      <p className="md:text-3xl font-medium font-poppins">{children}</p>
      {rightSide}
    </div>
  );
};

export default SectionHeading;
