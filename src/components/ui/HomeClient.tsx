'use client'

import React, { useState } from "react";
import ButtonFeedback from "./buttons/ButtonFeedback";
import ContactFormModal from "../forms/ContactFormModal";

export default function HomeClient() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <ButtonFeedback onClick={() => setShowForm(true)} />
      {showForm && <ContactFormModal onClose={() => setShowForm(false)} />}
    </>
  );
}