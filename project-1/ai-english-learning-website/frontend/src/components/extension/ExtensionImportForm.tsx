import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, Plus } from "lucide-react";
import Button from "../common/Button";
import Card from "../common/Card";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  sourceUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  rawContent: z.string().min(10, "Raw content must be at least 10 characters"),
  sourceType: z.string().min(1, "Please select a source type"),
});

type FormInput = z.infer<typeof schema>;

interface ExtensionImportFormProps {
  onAdd: (data: FormInput) => Promise<void>;
  onCancel: () => void;
}

export default function ExtensionImportForm({
  onAdd,
  onCancel,
}: ExtensionImportFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      sourceUrl: "",
      rawContent: "",
      sourceType: "WEBSITE",
    },
  });

  const onSubmit = async (data: FormInput) => {
    await onAdd(data);
    reset();
  };

  return (
    <Card className="border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Add Mock Extension Content</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title
          </label>
          <input
            {...register("title")}
            className={`input-base w-full ${errors.title ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200" : ""}`}
            placeholder="e.g. 5 idioms for business meetings"
          />
          {errors.title && (
            <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
              <AlertCircle size={12} /> {errors.title.message}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Source URL (Optional)
            </label>
            <input
              {...register("sourceUrl")}
              className={`input-base w-full ${errors.sourceUrl ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200" : ""}`}
              placeholder="e.g. https://example.com/idioms"
            />
            {errors.sourceUrl && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle size={12} /> {errors.sourceUrl.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Source Type
            </label>
            <select
              {...register("sourceType")}
              className={`input-base w-full bg-white ${errors.sourceType ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200" : ""}`}
            >
              <option value="WEBSITE">Website</option>
              <option value="ARTICLE">Article</option>
              <option value="VIDEO">Video</option>
              <option value="PDF">PDF</option>
              <option value="CUSTOM">Custom / Notepad</option>
            </select>
            {errors.sourceType && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle size={12} /> {errors.sourceType.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Raw Content
          </label>
          <textarea
            {...register("rawContent")}
            rows={6}
            className={`input-base w-full min-h-[120px] ${errors.rawContent ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200" : ""}`}
            placeholder="Paste raw notes or paragraphs here..."
          />
          {errors.rawContent && (
            <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
              <AlertCircle size={12} /> {errors.rawContent.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-1">
            <Plus size={16} />
            Add to Inbox
          </Button>
        </div>
      </form>
    </Card>
  );
}
