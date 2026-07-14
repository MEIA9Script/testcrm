import CRMApp from "../../components/CRMApp";

export default function DynamicViewPage({ params, searchParams }) {
  // Pega o parâmetro da URL (ex: 'config' em /config)
  const view = params.view;
  
  // Lista de views válidas
  const validViews = ["dashboard", "list", "kanban", "flows", "negocios", "config", "company"];
  
  // Se for uma view inválida, volta pro dashboard
  const initialView = validViews.includes(view) ? view : "dashboard";
  const initialCompanyId = searchParams?.id || null;

  return <CRMApp initialView={initialView} initialCompanyId={initialCompanyId} />;
}
