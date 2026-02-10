import { getIntegrations } from "./actions";
import { SettingsPanel } from "./settings-panel";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
    const integrations = await getIntegrations();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">Gerencie integrações e preferências do sistema.</p>
            </div>

            <SettingsPanel initialIntegrations={integrations} />
        </div>
    );
}
