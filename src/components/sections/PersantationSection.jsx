"use client";

import Image from "next/image";

export default function PersantationSection() {
  return (
    <section className="max-w-7xl mx-auto ">
      <Image
        src="/images/persentation.jpg"
        alt="App Download"
        width={1280}
        height={300}
        className="w-full h-auto rounded-md"
      />
    </section>
  );
}
