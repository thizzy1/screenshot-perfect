import React, { useState } from "react";
import { Ruler, Shirt, Footprints, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  apparelSizeGuide,
  adultShoeSizeGuide,
  kidsShoeSizeGuide,
} from "@/lib/sizing";

export interface SizeGuideModalProps {
  defaultCategory?: "apparel" | "footwear";
  trigger?: React.ReactNode;
}

export function SizeGuideModal({
  defaultCategory = "footwear",
  trigger,
}: SizeGuideModalProps) {
  const [shoeGroup, setShoeGroup] = useState<"adult" | "kids">("adult");

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            <Ruler className="h-3.5 w-3.5" />
            <span>Panduan Ukuran / Size Guide</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Ruler className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                Panduan Ukuran (Size Guide)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Standar ukuran apparel dan konversi ukuran sepatu Seaport
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue={defaultCategory} className="mt-2 w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="apparel" className="gap-2 text-xs font-bold sm:text-sm">
              <Shirt className="h-4 w-4" />
              <span>Apparel / Pakaian</span>
            </TabsTrigger>
            <TabsTrigger value="footwear" className="gap-2 text-xs font-bold sm:text-sm">
              <Footprints className="h-4 w-4" />
              <span>Footwear / Sepatu</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: APPAREL */}
          <TabsContent value="apparel" className="space-y-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-foreground">
                  Perbandingan LD × P (Sportswear Fit)
                </p>
                <p className="text-xs text-muted-foreground">
                  Ukuran kaos, jersey basket, hoodie, dan jaket
                </p>
              </div>
              <Badge variant="outline" className="text-[11px]">Toleransi ±1-2 cm</Badge>
            </div>

            <div className="rounded-xl border bg-card/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Size</TableHead>
                    <TableHead className="font-bold">Lebar Dada (LD)</TableHead>
                    <TableHead className="font-bold">Panjang Baju (P)</TableHead>
                    <TableHead className="font-bold">Rekomendasi Tinggi/Berat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apparelSizeGuide.map((item) => (
                    <TableRow key={item.size}>
                      <TableCell className="font-bold text-foreground">
                        {item.size}
                      </TableCell>
                      <TableCell>{item.chestWidth}</TableCell>
                      <TableCell>{item.length}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.recommendation}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-muted bg-muted/40 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">Tips Pengukuran Apparel:</p>
                <p className="mt-0.5">
                  Toleransi jahitan ±1–2 cm. Pengukuran Lebar Dada (LD) diukur mendatar
                  dari ketiak kiri ke ketiak kanan. Jika postur badan berada di antara
                  dua ukuran, disarankan memilih 1 ukuran lebih besar untuk kenyamanan pergerakan.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: FOOTWEAR */}
          <TabsContent value="footwear" className="space-y-4 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold uppercase text-foreground">
                  Konversi Ukuran Sepatu (Insole & Outsole)
                </p>
                <p className="text-xs text-muted-foreground">
                  Cocok untuk sepatu basket (ANTA KAI, PG7) dan sepatu lari
                </p>
              </div>
              <div className="flex gap-1.5 rounded-lg border bg-muted/50 p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={shoeGroup === "adult" ? "default" : "ghost"}
                  className="h-7 px-2.5 text-xs font-semibold"
                  onClick={() => setShoeGroup("adult")}
                >
                  Dewasa (EU 39–45)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={shoeGroup === "kids" ? "default" : "ghost"}
                  className="h-7 px-2.5 text-xs font-semibold"
                  onClick={() => setShoeGroup("kids")}
                >
                  Kids / GS (EU 29–37)
                </Button>
              </div>
            </div>

            <div className="rounded-xl border bg-card/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">EU</TableHead>
                    <TableHead className="font-bold">US</TableHead>
                    <TableHead className="font-bold">UK</TableHead>
                    <TableHead className="font-bold">Panjang Insole (cm)</TableHead>
                    <TableHead className="font-bold">Estimasi Outsole (cm)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(shoeGroup === "adult" ? adultShoeSizeGuide : kidsShoeSizeGuide).map(
                    (item) => (
                      <TableRow key={item.eu}>
                        <TableCell className="font-bold text-foreground">
                          EU {item.eu}
                        </TableCell>
                        <TableCell>US {item.us}</TableCell>
                        <TableCell>UK {item.uk}</TableCell>
                        <TableCell className="font-semibold text-primary">
                          {item.insole}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.outsole}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-muted bg-muted/40 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">Tips Memilih Ukuran Sepatu:</p>
                <p className="mt-0.5">
                  Disarankan memilih ukuran dengan panjang <strong>Insole +0.5 cm hingga +1.0 cm</strong> lebih panjang dari panjang telapak kaki asli Anda untuk memberikan ruang gerak jari kaki saat bermain basket atau lari intensif.
                </p>
                <p className="mt-1 text-[11px] opacity-80">
                  Cara mengukur: Letakkan tumit kaki tegak menempel di dinding di atas kertas, tandai ujung jari kaki terjauh, lalu ukur jaraknya dengan penggaris dalam satuan centimeter (cm).
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
