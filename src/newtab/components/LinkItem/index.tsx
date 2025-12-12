import React from 'react';

interface LinkItemProps {
  link: {
    url: string;
    icon: string;
    title: string;
    description: string;
  };
}

export default function Index({ link }: LinkItemProps) {
  return (
    <a
      href={link.url}
      className="glass-style-border rounded-2xl p-6 text-white no-underline transition-all duration-300  hover:bg-white/20 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/20"
    >
      <span className="text-3xl mb-2 block">{link.icon}</span>
      <div className="text-lg font-semibold mb-1">{link.title}</div>
      <div className="text-sm opacity-80">{link.description}</div>
    </a>
  );
}
