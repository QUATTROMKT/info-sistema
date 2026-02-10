import { getCredentials, createCredential, deleteCredential } from "./actions";
import { CredentialList } from "./credential-list"; // We will create this client component
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AcessosPage() {
    const credentials = await getCredentials();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Acessos & Senhas</h1>
                    <p className="text-muted-foreground">Gerencie todos os logins da sua operação.</p>
                </div>

                {/* We can use a Dialog here later, for now simple form toggle in Client Component */}
            </div>

            <CredentialList
                initialCredentials={credentials}
                createAction={createCredential}
                deleteAction={deleteCredential}
            />
        </div>
    );
}
