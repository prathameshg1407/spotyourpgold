"use client";

import React, { useEffect, useState } from "react";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import Skeleton from "./Skeleton";
import axios from "axios";
import { toast } from "sonner";

export function FeaturedCarousel( {loading, pgs}: {loading: boolean, pgs: any[]}) {


  let cards;

  if (loading) {
    cards = Array(8).fill(<Skeleton key={0} />);
  } else {
    cards = pgs.map((pg, idx) => (
      <Card key={idx} index={idx} card={pg} />
    ));
  }

  return (
    <div className="w-full h-full ">
      <Carousel items={cards} />
    </div>
  );
}
