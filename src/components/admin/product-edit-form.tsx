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

  const field = (name: string) => ({
    name,
    defaultValue: values[name] ?? "",
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
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
          <TextField label="Name" error={errors.name} {...field("name")} />
        )}
        <label className="block text-sm font-medium">
          Category
          <select {...field("categorySlug")} className={cn(inputClass, "h-10")}>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <FieldError id="categorySlug-error" message={errors.categorySlug} />
        </label>
        <TextField label="Origin" error={errors.origin} {...field("origin")} />
        <TextField label="Region" error={errors.region} {...field("region")} />
        <TextField label="Process" error={errors.process} {...field("process")} />
        <label className="block text-sm font-medium">
          Roast level
          <select {...field("roastLevel")} className={cn(inputClass, "h-10")}>
            {ROAST_LABELS.map((label, index) => (
              <option key={label} value={index + 1}>
                {index + 1} · {label}
              </option>
            ))}
          </select>
        </label>
        <TextField
          label="Tasting notes"
          hint="Comma-separated, up to six"
          error={errors.tastingNotes}
          className="sm:col-span-2"
          {...field("tastingNotes")}
        />
        <label className="block text-sm font-medium sm:col-span-2">
          Description
          <textarea {...field("description")} rows={3} className={cn(inputClass, "py-2")} />
          <FieldError id="description-error" message={errors.description} />
        </label>
        <label className="block text-sm font-medium">
          Bag colour
          <input
            type="color"
            {...field("bagColor")}
            className="mt-1 block h-10 w-20 cursor-pointer rounded-lg border bg-background p-1"
          />
          <FieldError id="bagColor-error" message={errors.bagColor} />
        </label>
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
                        id={`${priceField(variant.id)}-error`}
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
                        id={`${stockField(variant.id)}-error`}
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

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  name: string;
};

function TextField({ label, hint, error, className, name, ...input }: TextFieldProps) {
  return (
    <label className={cn("block text-sm font-medium", className)}>
      {label}
      {hint && <span className="ml-2 font-normal text-muted-foreground">{hint}</span>}
      <input name={name} {...input} className={cn(inputClass, "h-10")} />
      <FieldError id={`${name}-error`} message={error} />
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="mt-1 block text-xs font-normal text-destructive">
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
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 accent-primary"
      />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-muted-foreground">{hint}</span>}
      </span>
    </label>
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

  return (
    <>
      <label className="block text-sm font-medium">
        Name
        <input
          name="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugEdited) setSlug(slugify(event.target.value));
          }}
          aria-invalid={errors.name ? true : undefined}
          className={cn(inputClass, "h-10")}
        />
        <FieldError id="name-error" message={errors.name} />
      </label>
      <label className="block text-sm font-medium">
        URL
        <span className="ml-2 font-normal text-muted-foreground">/shop/{slug || "…"}</span>
        <input
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlugEdited(true);
            setSlug(event.target.value);
          }}
          aria-invalid={errors.slug ? true : undefined}
          aria-describedby={errors.slug ? "slug-error" : undefined}
          className={cn(inputClass, "h-10 font-mono")}
        />
        <FieldError id="slug-error" message={errors.slug} />
      </label>
    </>
  );
}
