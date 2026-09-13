"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ProductFormState } from "@/app/admin/(protected)/products/actions";
import { Button } from "@/components/ui/button";
import {
  ALL_VARIANT_SHAPES,
  LOADED_STOCK_FIELD,
  MAX_STOCK,
  emptyProductValues,
  priceField,
  productToValues,
  slugify,
  stockField,
} from "@/lib/admin/product-form";
import { GRIND_LABELS, type Category, type Product } from "@/lib/catalog/schema";
import { cn } from "@/lib/utils";

type ProductEditFormProps = {
  // Without a product the form creates one: it adds a URL field and starts from empty values.
  product?: Product;
  categories: Category[];
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
};

const inputClass =
  "mt-1 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

const ROAST_LABELS = ["Light", "Light-medium", "Medium", "Medium-dark", "Dark"];

export function ProductEditForm({ product, categories, action }: ProductEditFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, { status: "idle" });
  const isCreate = !product;

  useEffect(() => {
    if (state.status === "saved" && product) toast.success(`${product.name} saved`);
    if (state.status === "created") {
      toast.success("Product created");
      router.push(`/admin/products/${state.slug}`);
    }
  }, [state, product, router]);

  // React resets the form after every action. On failure, the submitted values are shown again
  // so nothing typed is lost; after a save, the refreshed product is the source of truth.
  const hasSubmittedValues = "values" in state;
  const values = hasSubmittedValues
    ? state.values
    : product
      ? productToValues(product)
      : emptyProductValues(categories[0]?.slug);
  const errors = state.status === "invalid" ? state.fieldErrors : {};
  const formKey = state.status === "idle" ? "idle" : `${state.status}-${state.at}`;
  const variantShapes = product?.variants ?? ALL_VARIANT_SHAPES;

  const field = (name: string, hint?: boolean) => ({
    ...controlProps(name, errors, hint),
    defaultValue: values[name] ?? "",
  });

  return (
    <form key={formKey} action={formAction} className="space-y-8">
      {!isCreate && (
        <input type="hidden" name={LOADED_STOCK_FIELD} defaultValue={values[LOADED_STOCK_FIELD]} />
      )}

      {(state.status === "conflict" || state.status === "error" || errors.form) && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
        >
          <p>{state.status === "invalid" ? errors.form : "message" in state && state.message}</p>
          {state.status === "conflict" && (
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              Reload latest stock
            </Button>
          )}
        </div>
      )}

      <section className="grid gap-4 rounded-xl border bg-card p-6 sm:grid-cols-2">
        <h2 className="text-lg font-semibold sm:col-span-2">Details</h2>
        {isCreate ? (
          <NameAndSlugFields values={values} errors={errors} />
        ) : (
          <Field name="name" label="Name" error={errors.name}>
            <input {...field("name")} className={cn(inputClass, "h-10")} />
          </Field>
        )}
        <Field name="categorySlug" label="Category" error={errors.categorySlug}>
          <select {...field("categorySlug")} className={cn(inputClass, "h-10")}>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field name="origin" label="Origin" error={errors.origin}>
          <input {...field("origin")} className={cn(inputClass, "h-10")} />
        </Field>
        <Field name="region" label="Region" error={errors.region}>
          <input {...field("region")} className={cn(inputClass, "h-10")} />
        </Field>
        <Field name="process" label="Process" error={errors.process}>
          <input {...field("process")} className={cn(inputClass, "h-10")} />
        </Field>
        <Field name="roastLevel" label="Roast level" error={errors.roastLevel}>
          <select {...field("roastLevel")} className={cn(inputClass, "h-10")}>
            {ROAST_LABELS.map((label, index) => (
              <option key={label} value={index + 1}>
                {index + 1} · {label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          name="tastingNotes"
          label="Tasting notes"
          hint="Comma-separated, up to six"
          error={errors.tastingNotes}
          className="sm:col-span-2"
        >
          <input {...field("tastingNotes", true)} className={cn(inputClass, "h-10")} />
        </Field>
        <Field
          name="description"
          label="Description"
          error={errors.description}
          className="sm:col-span-2"
        >
          <textarea {...field("description")} rows={3} className={cn(inputClass, "py-2")} />
        </Field>
        <Field name="bagColor" label="Bag colour" error={errors.bagColor}>
          <input
            type="color"
            {...field("bagColor")}
            className="mt-1 block h-10 w-20 cursor-pointer rounded-lg border bg-background p-1"
          />
        </Field>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Visibility</h2>
        <Checkbox
          name="active"
          defaultChecked={values.active === "on"}
          label="Visible in the shop"
          hint="Hidden products disappear from the shop and can't be bought."
        />
        <Checkbox
          name="featured"
          defaultChecked={values.featured === "on"}
          label="Featured on the home page"
        />
      </section>

      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Variants</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Size</th>
                <th className="pb-2 font-medium">Grind</th>
                <th className="pb-2 font-medium">Price (USD)</th>
                <th className="pb-2 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {variantShapes.map((variant) => {
                const label = `${variant.size} ${GRIND_LABELS[variant.grind]}`;
                return (
                  <tr key={variant.id}>
                    <td className="py-2 pr-4">{variant.size}</td>
                    <td className="py-2 pr-4">{GRIND_LABELS[variant.grind]}</td>
                    <td className="py-2 pr-4">
                      <input
                        {...field(priceField(variant.id))}
                        inputMode="decimal"
                        aria-label={`Price for ${label}`}
                        className={cn(inputClass, "mt-0 h-9 w-28 tabular-nums")}
                      />
                      <FieldError
                        id={`${controlId(priceField(variant.id))}-error`}
                        message={errors[priceField(variant.id)]}
                      />
                    </td>
                    <td className="py-2">
                      <input
                        {...field(stockField(variant.id))}
                        type="number"
                        min={0}
                        max={MAX_STOCK}
                        aria-label={`Stock for ${label}`}
                        className={cn(inputClass, "mt-0 h-9 w-24 tabular-nums")}
                      />
                      <FieldError
                        id={`${controlId(stockField(variant.id))}-error`}
                        message={errors[stockField(variant.id)]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending} className="h-10 px-6">
          {isPending ? "Saving…" : isCreate ? "Create product" : "Save changes"}
        </Button>
        {state.status === "invalid" && (
          <p className="text-sm text-destructive">Fix the highlighted fields and save again.</p>
        )}
      </div>
    </form>
  );
}

const controlId = (name: string) => `field-${name.replace(/[^a-z0-9-]/gi, "-")}`;

// Labels point at their control with htmlFor instead of wrapping it, so a select's options or a
// hint don't leak into the control's accessible name; hints and errors go in aria-describedby.
function controlProps(name: string, errors: Record<string, string>, hint?: boolean) {
  const id = controlId(name);
  const describedBy = [hint && `${id}-hint`, errors[name] && `${id}-error`].filter(Boolean);
  return {
    id,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": describedBy.length > 0 ? describedBy.join(" ") : undefined,
  };
}

function Field({
  name,
  label,
  hint,
  error,
  className,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const id = controlId(name);
  return (
    <div className={cn("text-sm", className)}>
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      {hint && (
        <span id={`${id}-hint`} className="ml-2 text-muted-foreground">
          {hint}
        </span>
      )}
      {children}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="mt-1 block text-xs text-destructive">
      {message}
    </span>
  );
}

function Checkbox({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked: boolean;
}) {
  const id = controlId(name);
  return (
    <div className="flex items-start gap-3 text-sm">
      <input
        id={id}
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-0.5 size-4 accent-primary"
      />
      <div>
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {hint && (
          <span id={`${id}-hint`} className="block text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

function NameAndSlugFields({
  values,
  errors,
}: {
  values: Record<string, string>;
  errors: Record<string, string>;
}) {
  const [name, setName] = useState(values.name ?? "");
  const [slug, setSlug] = useState(values.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(values.slug));
  const nameProps = controlProps("name", errors);
  const slugProps = controlProps("slug", errors, true);

  return (
    <>
      <Field name="name" label="Name" error={errors.name}>
        <input
          {...nameProps}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugEdited) setSlug(slugify(event.target.value));
          }}
          className={cn(inputClass, "h-10")}
        />
      </Field>
      <Field name="slug" label="URL" hint={`/shop/${slug || "…"}`} error={errors.slug}>
        <input
          {...slugProps}
          value={slug}
          onChange={(event) => {
            setSlugEdited(true);
            setSlug(event.target.value);
          }}
          className={cn(inputClass, "h-10 font-mono")}
        />
      </Field>
    </>
  );
}
