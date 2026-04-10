"use client";

import Image from "next/image";

export default function AppDownloadSection() {
  return (
    <section className="max-w-7xl mx-auto ">
      <Image
        src="/images/app_template.jpg"
        alt="App Download"
        width={1280}
        height={300}
        className="w-full h-auto rounded-md"
      />
    </section>
  );
}
