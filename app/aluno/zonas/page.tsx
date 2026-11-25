import { redirect } from "next/navigation";

// As zonas agora ficam na própria Minha área.
export default function MinhasZonas() {
  redirect("/aluno#zonas");
}
