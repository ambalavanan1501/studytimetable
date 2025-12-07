import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
}

export function SEO({
    title = "CGPA Calculator & Timetable",
    description = "A comprehensive tool for students to calculate CGPA and manage their class timetables.",
    keywords = "CGPA, Timetable, Student, Calculator, Education, Planner",
    image = "/screenshot-desktop.png",
    url = "https://studytimetable.vercel.app/"
}: SEOProps) {
    const fullTitle = title === "CGPA Calculator & Timetable" ? title : `${title} | StudyTime`;

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{fullTitle}</title>
            <meta name='description' content={description} />
            <meta name='keywords' content={keywords} />
            <link rel="canonical" href={url} />

            {/* End standard metadata tags */}

            {/* Facebook tags */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />
            {/* End Facebook tags */}

            {/* Twitter tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:creator" content="@StudyTime" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            {/* End Twitter tags */}
        </Helmet>
    );
}
