
import React from "react";
import SectionInfo from "../components/section/SectionInfo";
import SectionServices from "../components/section/SectionServices";
import Header from "../components/ui/Header";
import SectionActuality from "../components/section/SectionActuality";
import SectionArticles from "../components/section/SectionArticles";
import Footer from "../components/ui/Footer";
import HomeClient from "../components/ui/HomeClient";

export default function Home() {
	return (
		<>
			<Header />
			<SectionInfo />
			<SectionServices />
			<HomeClient />
			<SectionActuality />
			{/* Recent publications section */}
			<SectionArticles />
			<Footer />
		</>
	);
}
