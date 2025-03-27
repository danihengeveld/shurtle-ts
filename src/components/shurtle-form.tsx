"use client";

import { Label } from "@radix-ui/react-label";
import { Field, Form, Formik, type FormikProps } from "formik";
import { Loader2 } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import { useRef, type FC } from "react";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { toast } from "sonner";
import { api, type RouterInputs } from "~/utils/api";
import shurtlePicDark from "../../public/assets/img/turtle-black.svg";
import shurtlePicWhite from "../../public/assets/img/turtle-white.svg";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const shurtleFormSchema = z.object({
  url: z.string().url({ message: "Must be a valid URL!" }),
  slug: z
    .string({ required_error: "Cannot be empty!" })
    .regex(/^[a-z0-9](-?[a-z0-9])*$/, {
      message: "Invalid slug!",
    }),
});

type ShurtleFormInputs = RouterInputs["shurtle"]["create"];

const ShurtleForm: FC = () => {
  const formikRef = useRef<FormikProps<ShurtleFormInputs>>(null);

  const shurtleMutation = api.shurtle.create.useMutation({
    onSettled: (data, error) => {
      console.log(error?.message)
      if (error) {
        if (error.data?.code === "CONFLICT") {
          toast.info("Uh oh! I'm afraid this one is already taken. Try another!", {
            description: error.message
          });
        } else if (error.data?.code === "TOO_MANY_REQUESTS") {
          toast.warning("Uh oh! I'm afraid you are hitting the rate limiters.", {
            description: error.message,
            cancel: {
              label: "I'll wait!",
              onClick: () => void (0),
            }
          });
        } else {
          toast.error("Uh oh! Something went wrong.", {
            description: "Something went wrong on our side. Please have another go at it!"
          });
        }
      } else if (data) {
        formikRef.current?.resetForm();
        toast.success("You shurtled it!", {
          description: `The shurtle: ${data.slug}, is live now!`,
          action: {
            label: "Copy",
            onClick: () => {
              void navigator.clipboard.writeText(`https://shurtle.app/${data.slug}`);
            }
          },
          duration: 3000
        });
      }
    },
  });

  return (
    <Formik<ShurtleFormInputs>
      initialValues={{
        url: "",
        slug: "",
      }}
      onSubmit={(values) => {
        shurtleMutation.mutate(values);
      }}
      validateOnBlur={true}
      validationSchema={toFormikValidationSchema(shurtleFormSchema)}
      innerRef={formikRef}
    >
      {(formikState) => {
        const errors = formikState.errors;
        const touched = formikState.touched;

        return (
          <Form className="grid w-full max-w-sm items-center gap-4 rounded-2xl border p-6">
            <div className="flex flex-row items-center justify-between">
              <h1 className="mb-4 text-4xl font-bold">Shurtle</h1>
              <div className="relative h-12 w-12">
                <Image
                  className="invisible absolute dark:visible"
                  src={shurtlePicWhite as StaticImageData}
                  alt=""
                />
                <Image
                  className="visible absolute dark:invisible"
                  src={shurtlePicDark as StaticImageData}
                  alt=""
                />
              </div>
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="url" className="text-base">
                Full URL
              </Label>
              <Field
                as={Input}
                type="url"
                id="url"
                name="url"
                placeholder="https://github.com/danihengeveld"
                disabled={shurtleMutation.isLoading}
              />
              <div className="flex flex-row justify-between">
                <p className="text-sm text-muted-foreground">Enter the full URL.</p>
                {!!errors.url && touched.url && (
                  <p className="text-sm text-destructive">{errors.url}</p>
                )}
              </div>
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="url" className="text-base">
                Slug
              </Label>
              <Field
                as={Input}
                type="text"
                id="slug"
                name="slug"
                placeholder="gh-danih"
                disabled={shurtleMutation.isLoading}
              />
              <div className="flex flex-row justify-between">
                <p className="text-sm text-muted-foreground">Enter the slug (short URL).</p>
                {!!errors.slug && touched.slug && (
                  <p className="text-sm text-destructive">{errors.slug}</p>
                )}
              </div>
            </div>
            <Button
              disabled={shurtleMutation.isLoading}
              type="submit"
              className="text-md w-fit justify-self-end font-semibold"
            >
              {shurtleMutation.isLoading && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Shurtling
                </>
              )}
              {!shurtleMutation.isLoading && <>Shurtle it!</>}
            </Button>
          </Form>
        );
      }}
    </Formik>
  );
};

export default ShurtleForm;
