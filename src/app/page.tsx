
"use client"
import React from "react";
import SectionInfo from "../components/section/SectionInfo";
import SectionServices from "../components/section/SectionServices";
import Header from "../components/ui/Header";
import ButtonFeedback from "../components/ui/buttons/ButtonFeedback";
import SectionActuality from "../components/section/SectionActuality";
import ContactForm from "../components/forms/ContactForm";
import Footer from "../components/ui/Footer";

export default function Home() {
	const [showForm, setShowForm] = React.useState(false);
		return (
			<>
				<Header />
				<SectionInfo />
				<SectionServices />
				<ButtonFeedback onClick={() => setShowForm(true)} />
				{showForm && <ContactForm onClose={() => setShowForm(false)} />}
				<SectionActuality />
				<Footer />
			</>
		);
}

	<SectionServices />
