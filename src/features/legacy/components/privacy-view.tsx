"use client";

import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface Props {
    content: string;
}

export function PrivacyView({ content }: Props) {
    return (
        <motion.section
            className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <section className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
                <div className="max-w-3xl mx-auto px-6 py-16">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
                            Privacy and Policy
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Updated on October 2025
                        </p>
                    </div>

                    {/* Markdown content */}
                    <article className="prose prose-lg dark:prose-invert prose-headings:font-semibold prose-a:text-blue-600 hover:prose-a:underline prose-blockquote:border-l-blue-500 prose-code:text-blue-500">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </article>
                </div>
            </section>
        </motion.section>
    );
}