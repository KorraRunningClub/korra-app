import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FormEntrar } from "./FormEntrar";

export const metadata = { title: "Entrar · Korrá Running Club" };

export default function EntrarPage() {
  return (
    <>
      <SiteHeader />
      <main className="app-shell">
        <div className="wrap" style={{ display: "grid", gap: "28px" }}>
          <div>
            <div className="eyebrow">Área do aluno</div>
            <h1 style={{ marginTop: "14px" }}>Entrar</h1>
            <p style={{ marginTop: "14px" }}>
              Digite seu e-mail. A gente manda um link para você entrar, sem senha.
            </p>
          </div>
          <Suspense>
            <FormEntrar />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
