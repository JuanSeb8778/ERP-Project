import { useState } from "react";
import type { DefaultValues, FieldValues } from "react-hook-form";
import type { ZodTypeAny } from "zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { DataTable, type Column } from "./DataTable";
import { AutoForm, type FieldConfig } from "./AutoForm";
import { ConfirmDialog } from "./ConfirmDialog";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { useList, useCreate, useUpdate, useRemove, useTableParams } from "@/hooks/useResource";
import { apiErrorMessage } from "@/lib/api";
import type { PermissionKey } from "@techforge/shared";

interface WithId {
  id: string;
}

export interface ResourceManagerProps<T extends WithId, F extends FieldValues> {
  resource: string;
  title: string;
  description?: string;
  singular: string;
  icon?: React.ComponentType<{ className?: string }>;
  columns: Column<T>[];
  fields: FieldConfig[];
  createSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
  emptyValues: DefaultValues<F>;
  toFormValues: (row: T) => DefaultValues<F>;
  defaultSort?: string;
  searchPlaceholder?: string;
  permissions: { create?: PermissionKey; update?: PermissionKey; delete?: PermissionKey };
  /** Extra content rendered above the table (e.g. stat cards). */
  header?: React.ReactNode;
  /** Dynamic select options injected into fields by name (e.g. customer list). */
  fieldOptions?: Record<string, { value: string; label: string }[]>;
}

export function ResourceManager<T extends WithId, F extends FieldValues>(props: ResourceManagerProps<T, F>) {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const tp = useTableParams(props.defaultSort ?? "createdAt:desc");
  const list = useList<T>(props.resource, { ...tp.params, pageSize: 20 });
  const create = useCreate<T>(props.resource);
  const update = useUpdate<T>(props.resource);
  const remove = useRemove(props.resource);

  const [editing, setEditing] = useState<T | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<T | null>(null);

  const canCreate = props.permissions.create ? hasPermission(props.permissions.create) : false;
  const canUpdate = props.permissions.update ? hasPermission(props.permissions.update) : false;
  const canDelete = props.permissions.delete ? hasPermission(props.permissions.delete) : false;

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (row: T) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const onSubmit = async (values: F) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, body: values });
        toast.success(`${props.singular} updated`);
      } else {
        await create.mutateAsync(values);
        toast.success(`${props.singular} created`);
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error("Could not save", apiErrorMessage(err));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success(`${props.singular} deleted`);
      setDeleting(null);
    } catch (err) {
      toast.error("Could not delete", apiErrorMessage(err));
    }
  };

  const columns: Column<T>[] = [...props.columns];
  if (canUpdate || canDelete) {
    columns.push({
      key: "_actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {canUpdate && (
            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleting(row)}
              aria-label="Delete"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title={props.title}
        description={props.description}
        actions={
          canCreate && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New {props.singular}
            </Button>
          )
        }
      />

      {props.header}

      <DataTable
        columns={columns}
        data={list.data?.data ?? []}
        rowKey={(r) => r.id}
        loading={list.isLoading}
        search={tp.q}
        onSearchChange={tp.setQ}
        searchPlaceholder={props.searchPlaceholder}
        sort={tp.sort}
        onSortChange={tp.setSort}
        page={tp.page}
        pageSize={20}
        total={list.data?.meta.total ?? 0}
        onPageChange={tp.setPage}
        emptyTitle={`No ${props.title.toLowerCase()} found`}
        emptyDescription={canCreate ? `Create your first ${props.singular.toLowerCase()} to get started.` : undefined}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? `Edit ${props.singular}` : `New ${props.singular}`}
        description={editing ? `Update ${props.singular.toLowerCase()} details.` : `Add a new ${props.singular.toLowerCase()}.`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="resource-form" disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : `Create ${props.singular}`}
            </Button>
          </>
        }
      >
        <AutoForm<F>
          id="resource-form"
          key={editing?.id ?? "new"}
          fields={
            props.fieldOptions
              ? props.fields.map((f) =>
                  props.fieldOptions?.[f.name] ? { ...f, options: props.fieldOptions[f.name] } : f,
                )
              : props.fields
          }
          schema={editing ? props.updateSchema : props.createSchema}
          defaultValues={editing ? props.toFormValues(editing) : props.emptyValues}
          onSubmit={onSubmit}
        />
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${props.singular}?`}
        description={`This will remove "${(deleting as { name?: string })?.name ?? "this record"}". You can re-create it later.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
