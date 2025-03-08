"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { UserCircle, Home, Video, BookOpen, BarChart4 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardNavbar() {
  const supabase = createClient();
  const router = useRouter();

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" prefetch className="text-xl font-bold text-teal-600">
            CounselorSim
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/scenarios"
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600"
          >
            <Video className="h-4 w-4" />
            <span>Scenarios</span>
          </Link>
          <Link
            href="/progress"
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600"
          >
            <BarChart4 className="h-4 w-4" />
            <span>Progress</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600"
          >
            <BookOpen className="h-4 w-4" />
            <span>Resources</span>
          </Link>
        </div>

        <div className="flex gap-4 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
