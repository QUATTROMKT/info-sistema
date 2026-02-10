import { getProducts, createProduct, deleteProduct, updateProductStatus } from "./actions";
import { ProductPipeline } from "./product-pipeline";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
    const products = await getProducts();

    return (
        <div className="space-y-6 h-[calc(100vh-4rem)] flex flex-col">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Produtos & Ofertas</h1>
                <p className="text-muted-foreground">Gerencie sua esteira (Mineração, Validação, Escala).</p>
            </div>

            <ProductPipeline
                initialProducts={products}
                createAction={createProduct}
                deleteAction={deleteProduct}
                updateStatusAction={updateProductStatus}
            />
        </div>
    );
}
