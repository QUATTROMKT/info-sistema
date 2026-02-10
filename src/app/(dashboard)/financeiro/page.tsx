import { getFinancialRecords, createFinancialRecord, deleteFinancialRecord, toggleFinancialStatus } from "./actions";
import { FinancialList } from "./financial-list";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
    const records = await getFinancialRecords();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
                <p className="text-muted-foreground">Controle de receitas e despesas da operação.</p>
            </div>

            <FinancialList
                initialRecords={records}
                createAction={createFinancialRecord}
                deleteAction={deleteFinancialRecord}
                toggleStatusAction={toggleFinancialStatus}
            />
        </div>
    );
}
