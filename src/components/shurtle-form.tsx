"use client";

import { Label } from "@radix-ui/react-label";
import { Field, Form, Formik, type FormikProps } from "formik";
import { Loader2 } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import { useRef } from "react";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useToast } from "~/hooks/ui/use-toast";
import { api, type RouterInputs } from "~/utils/api";
import shurtlePicDark from "../../public/assets/img/turtle-black.svg";
import shurtlePicWhite from "../../public/assets/img/turtle-white.svg";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ToastAction } from "./ui/toast";

const shurtleFormSchema = z.object({
  url: z.string().url({ message: "Must be a valid URL!" }),
  slug: z
    .string({ required_error: "Cannot be empty!" })
    .regex(/^[a-z0-9](-?[a-z0-9])*$/, {
      message: "Invalid slug!",
    }),
});

type ShurtleFormInputs = RouterInputs["shurtle"]["create"];

const ShurtleForm = () => {
  const formikRef = useRef<FormikProps<ShurtleFormInputs>>(null);
  const { toast } = useToast();

  const shurtleMutation = api.shurtle.create.useMutation({
    onSettled: (data, error) => {
      console.log(error?.message)
      if (error) {
        if (error.data?.code == "CONFLICT") {
          toast({
            variant: "destructive",
            title: "Uh oh! I'm afraid this one is already taken.",
            description: error.message,
            action: (
              <ToastAction altText="Try another!">Try another!</ToastAction>
            ),
          });
        } else {
          toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description:
              "Something went wrong on our side. Please have another go at it!",
            action: (
              <ToastAction altText="Try it again!">Try again!</ToastAction>
            ),
          });
        }
      } else if (data) {
        formikRef.current?.resetForm();
        toast({
          title: "You shurtled it!",
          description: `The shurtle: ${data.slug}, is live now!`,
          action: <ToastAction altText="Yes">Yeahh</ToastAction>,
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
          <Form className="grid w-full max-w-sm items-center gap-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800/50 dark:shadow-slate-800/50">
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
                <p className="text-sm text-slate-500">Enter the full URL.</p>
                {!!errors.url && touched.url && (
                  <p className="text-sm text-red-400">{errors.url}</p>
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
                <p className="text-sm text-slate-500">Enter the slug (short URL).</p>
                {!!errors.slug && touched.slug && (
                  <p className="text-sm text-red-400">{errors.slug}</p>
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
