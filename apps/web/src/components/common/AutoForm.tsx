import { useForm, Controller, type DefaultValues, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodTypeAny } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, type SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FieldType = "text" | "email" | "number" | "textarea" | "select" | "switch";

export interface FieldConfig {
  name: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: SelectOption[];
  colSpan?: 1 | 2;
  prefix?: string;
  hint?: string;
}

interface AutoFormProps<T extends FieldValues> {
  id: string;
  fields: FieldConfig[];
  schema: ZodTypeAny;
  defaultValues: DefaultValues<T>;
  onSubmit: (values: T) => void;
}

export function AutoForm<T extends FieldValues>({
  id,
  fields,
  schema,
  defaultValues,
  onSubmit,
}: AutoFormProps<T>) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<T>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  return (
    <form id={id} onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const error = (errors as Record<string, { message?: string }>)[f.name]?.message;
        const type = f.type ?? "text";
        return (
          <div key={f.name} className={cn("space-y-1.5", (f.colSpan ?? 1) === 2 && "sm:col-span-2")}>
            {type !== "switch" && <Label htmlFor={f.name}>{f.label}</Label>}

            {type === "textarea" ? (
              <Textarea id={f.name} placeholder={f.placeholder} {...register(f.name as never)} />
            ) : type === "select" ? (
              <Select id={f.name} options={f.options} placeholder={f.placeholder} {...register(f.name as never)} />
            ) : type === "switch" ? (
              <label className="flex cursor-pointer items-center gap-2.5 pt-6">
                <Controller
                  control={control}
                  name={f.name as never}
                  render={({ field }) => (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(field.value)}
                      onClick={() => field.onChange(!field.value)}
                      className={cn(
                        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                        field.value ? "bg-primary" : "bg-input",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
                          field.value ? "left-[18px]" : "left-0.5",
                        )}
                      />
                    </button>
                  )}
                />
                <span className="text-sm font-medium">{f.label}</span>
              </label>
            ) : (
              <div className="relative">
                {f.prefix && (
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {f.prefix}
                  </span>
                )}
                <Input
                  id={f.name}
                  type={type === "number" ? "number" : type === "email" ? "email" : "text"}
                  step={type === "number" ? "any" : undefined}
                  placeholder={f.placeholder}
                  className={cn(f.prefix && "pl-7")}
                  {...register(f.name as never)}
                />
              </div>
            )}

            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : f.hint ? (
              <p className="text-xs text-muted-foreground">{f.hint}</p>
            ) : null}
          </div>
        );
      })}
    </form>
  );
}
