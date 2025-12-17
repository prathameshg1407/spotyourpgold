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
      <div className="md:text-3xl font-medium font-poppins">{children}</div>
      {rightSide}
    </div>
  );
};

export default SectionHeading;
