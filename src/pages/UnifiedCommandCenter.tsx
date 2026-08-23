import { useState } from 'react';
import { CommandCenterShell } from '../features/command-center/CommandCenterShell';
import { BUSINESS_MIGRATION_COMMANDS, BusinessMigrationWorkspace, type BusinessMigrationCommand } from '../features/command-center/BusinessMigrationWorkspace';
import { CatalogCommandWorkspace, type CatalogCommand, CATALOG_NATIVE_COMMANDS } from '../features/command-center/CatalogCommandWorkspace';
import { NATIVE_OPERATIONS_COMMANDS, NativeOperationsWorkspace, type NativeOperationsCommand } from '../features/command-center/NativeOperationsWorkspace';
import { BUSINESS_CONFIGURATION_COMMANDS, BusinessConfigurationWorkspace, type BusinessConfigurationCommand } from '../features/command-center/BusinessConfigurationWorkspace';
import { CATALOG_ASSETS_COMMANDS, CatalogAssetsWorkspace, type CatalogAssetsCommand } from '../features/command-center/CatalogAssetsWorkspace';
import type { CommandDefinition } from '../features/command-center/registry';
import { ProductCatalogManager } from '../components/ProductCatalogManager';
import { ProductInventoryManager } from '../components/ProductInventoryManager';
import { useAppConfig } from '../hooks/useAppConfig';

interface UnifiedCommandCenterProps { onNavigateToUsers?:()=>void; onNavigateToAudit?:()=>void; onLockApp?:()=>void; }
export default function UnifiedCommandCenter(props: UnifiedCommandCenterProps) {
 const {config,loading,updateStandardSets,generateSetsFromSubcategories,resetToDefaultCatalog,updateProductCategories,addProductCategory,updateProductCategory,deleteProductCategory,addProductItem,updateProductItem,deleteProductItem,adjustProductStock}=useAppConfig();
 const [activeCommand,setActiveCommand]=useState<BusinessMigrationCommand>('business.brand');
 const [activeCatalogCommand,setActiveCatalogCommand]=useState<CatalogCommand>('catalog.products');
 const [activeNativeCommand,setActiveNativeCommand]=useState<NativeOperationsCommand>('experience.design');
 const [activeConfigurationCommand,setActiveConfigurationCommand]=useState<BusinessConfigurationCommand>('business.configuration');
 const [activeAssetsCommand,setActiveAssetsCommand]=useState<CatalogAssetsCommand>('catalog.assets');
 const handleCommand=(command:CommandDefinition)=>{
  if(BUSINESS_MIGRATION_COMMANDS.some(item=>item.id===command.id))setActiveCommand(command.id as BusinessMigrationCommand);
  if(CATALOG_NATIVE_COMMANDS.some(item=>item.id===command.id))setActiveCatalogCommand(command.id as CatalogCommand);
  if(NATIVE_OPERATIONS_COMMANDS.some(item=>item.id===command.id))setActiveNativeCommand(command.id as NativeOperationsCommand);
  if(BUSINESS_CONFIGURATION_COMMANDS.some(item=>item.id===command.id))setActiveConfigurationCommand(command.id as BusinessConfigurationCommand);
  if(CATALOG_ASSETS_COMMANDS.some(item=>item.id===command.id))setActiveAssetsCommand(command.id as CatalogAssetsCommand);
 };
 const productsWorkspace=<ProductCatalogManager standardSets={config.standardSets||[]} onUpdateSets={updateStandardSets} incomeCategories={config.incomeCategories||[]} onGenerateFromSubcategories={generateSetsFromSubcategories} onResetToDefaultCatalog={resetToDefaultCatalog}/>;
 const inventoryWorkspace=<ProductInventoryManager categories={config.productCategories||[]} onUpdateCategories={updateProductCategories} onAddCategory={addProductCategory} onUpdateCategory={updateProductCategory} onDeleteCategory={deleteProductCategory} onAddProduct={addProductItem} onUpdateProduct={updateProductItem} onDeleteProduct={deleteProductItem} onAdjustStock={adjustProductStock}/>;
 return <CommandCenterShell additionalCommands={[...BUSINESS_MIGRATION_COMMANDS,...CATALOG_NATIVE_COMMANDS,...NATIVE_OPERATIONS_COMMANDS,...BUSINESS_CONFIGURATION_COMMANDS,...CATALOG_ASSETS_COMMANDS]} onSelectCommand={handleCommand}>
  <BusinessMigrationWorkspace {...props} activeCommand={activeCommand} onActiveCommandChange={setActiveCommand}/>
  <div className="space-y-3" aria-busy={loading}><CatalogCommandWorkspace activeCommand={activeCatalogCommand} onActiveCommandChange={setActiveCatalogCommand} productsWorkspace={productsWorkspace} inventoryWorkspace={inventoryWorkspace}/></div>
  <BusinessConfigurationWorkspace activeCommand={activeConfigurationCommand} onActiveCommandChange={setActiveConfigurationCommand}/>
  <CatalogAssetsWorkspace activeCommand={activeAssetsCommand} onActiveCommandChange={setActiveAssetsCommand}/>
  <NativeOperationsWorkspace activeCommand={activeNativeCommand} onActiveCommandChange={setActiveNativeCommand}/>
 </CommandCenterShell>;
}
