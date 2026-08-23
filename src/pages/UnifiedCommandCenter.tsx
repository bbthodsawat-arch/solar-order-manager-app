import { useState } from 'react';
import { CommandCenterShell } from '../features/command-center/CommandCenterShell';
import { BUSINESS_MIGRATION_COMMANDS, BusinessMigrationWorkspace, type BusinessMigrationCommand } from '../features/command-center/BusinessMigrationWorkspace';
import { CatalogCommandWorkspace, type CatalogCommand, CATALOG_NATIVE_COMMANDS } from '../features/command-center/CatalogCommandWorkspace';
import type { CommandDefinition } from '../features/command-center/registry';
import { ProductCatalogManager } from '../components/ProductCatalogManager';
import { ProductInventoryManager } from '../components/ProductInventoryManager';
import { useAppConfig } from '../hooks/useAppConfig';

interface UnifiedCommandCenterProps {
  onNavigateToUsers?: () => void;
  onNavigateToAudit?: () => void;
  onLockApp?: () => void;
}

export default function UnifiedCommandCenter(props: UnifiedCommandCenterProps) {
  const { config, loading, updateStandardSets, generateSetsFromSubcategories, resetToDefaultCatalog, updateProductCategories, addProductCategory, updateProductCategory, deleteProductCategory, addProductItem, updateProductItem, deleteProductItem, adjustProductStock } = useAppConfig();
  const [activeCommand, setActiveCommand] = useState<BusinessMigrationCommand>('business.brand');
  const [activeCatalogCommand, setActiveCatalogCommand] = useState<CatalogCommand>('catalog.products');

  const handleCommand = (command: CommandDefinition) => {
    if (BUSINESS_MIGRATION_COMMANDS.some(item => item.id === command.id)) setActiveCommand(command.id as BusinessMigrationCommand);
    if (CATALOG_NATIVE_COMMANDS.some(item => item.id === command.id)) setActiveCatalogCommand(command.id as CatalogCommand);
  };

  const productsWorkspace = (
    <ProductCatalogManager
      standardSets={config.standardSets || []}
      onUpdateSets={updateStandardSets}
      incomeCategories={config.incomeCategories || []}
      onGenerateFromSubcategories={generateSetsFromSubcategories}
      onResetToDefaultCatalog={resetToDefaultCatalog}
    />
  );

  const inventoryWorkspace = (
    <ProductInventoryManager
      categories={config.productCategories || []}
      onUpdateCategories={updateProductCategories}
      onAddCategory={addProductCategory}
      onUpdateCategory={updateProductCategory}
      onDeleteCategory={deleteProductCategory}
      onAddProduct={addProductItem}
      onUpdateProduct={updateProductItem}
      onDeleteProduct={deleteProductItem}
      onAdjustStock={adjustProductStock}
    />
  );

  return (
    <CommandCenterShell additionalCommands={[...BUSINESS_MIGRATION_COMMANDS, ...CATALOG_NATIVE_COMMANDS]} onSelectCommand={handleCommand}>
      <BusinessMigrationWorkspace {...props} activeCommand={activeCommand} onActiveCommandChange={setActiveCommand} />
      <div className="space-y-3" aria-busy={loading}>
        <CatalogCommandWorkspace activeCommand={activeCatalogCommand} onActiveCommandChange={setActiveCatalogCommand} productsWorkspace={productsWorkspace} inventoryWorkspace={inventoryWorkspace} />
      </div>
    </CommandCenterShell>
  );
}
